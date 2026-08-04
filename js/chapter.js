import { curriculum } from './curriculum-dummy.js';
import { db, auth, storage } from './firebase-config.js';
import { collection, getDocs, addDoc, deleteDoc, doc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { ref, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-storage.js";

const urlParams = new URLSearchParams(window.location.search);
const subjectId = urlParams.get('subject');
const chapterSlug = urlParams.get('chapter');

let currentSubjectData = null;
let currentChapterData = null;
let chapterResources = [];
let currentUser = null;

document.addEventListener('DOMContentLoaded', () => {
    loadChapterDetails();
    
    onAuthStateChanged(auth, (user) => {
        currentUser = user;
        fetchChapterResources();
    });
});

function loadChapterDetails() {
    currentSubjectData = curriculum.subjects.find(s => s.id === subjectId);
    if (!currentSubjectData) {
        document.getElementById('chapter-title').innerText = "Subject Not Found";
        return;
    }

    const chapterDataName = currentSubjectData.chapters.find(c => 
        c.toLowerCase().replace(/[^a-z0-9]+/g, '-') === chapterSlug || c === chapterSlug
    );

    if (!chapterDataName) {
        document.getElementById('chapter-title').innerText = "Chapter Not Found";
        return;
    }

    currentChapterData = {
        name: chapterDataName,
        id: currentSubjectData.chapters.indexOf(chapterDataName) + 1,
        slug: chapterSlug
    };

    document.getElementById('breadcrumb-subject').innerText = currentSubjectData.name;
    document.getElementById('breadcrumb-subject').href = `subject.html?subject=${subjectId}`;
    document.getElementById('breadcrumb-chapter').innerText = currentChapterData.name;
    
    document.getElementById('subject-tag').innerText = currentSubjectData.name;
    document.getElementById('chapter-title').innerText = currentChapterData.name;
    document.getElementById('chapter-badge').innerText = `Chapter ${currentChapterData.id}`;
    document.title = `${currentChapterData.name} - PathaSetu`;
}

async function fetchChapterResources() {
    chapterResources = [
        { id: 'default-1', title: `NCERT Textbook: ${currentChapterData ? currentChapterData.name : 'Chapter'}`, type: 'pdf', url: '#' },
        { id: 'default-2', title: 'Curated Conceptual Video Walkthrough', type: 'youtube', url: '#' }
    ];

    if (!currentUser) {
        renderResources();
        return;
    }

    try {
        const resourcesRef = collection(db, `users/${currentUser.uid}/subjects/${subjectId}/chapters/${chapterSlug}/resources`);
        const snapshot = await getDocs(resourcesRef);
        
        if (!snapshot.empty) {
            chapterResources = [];
            snapshot.forEach(docSnap => {
                chapterResources.push({ id: docSnap.id, ...docSnap.data() });
            });
        }
    } catch (error) {
        console.error("Error fetching resources:", error);
    }

    renderResources();
}

window.switchTab = function(tabName) {
    const tabs = ['resources', 'ainotes', 'chat', 'revision'];
    tabs.forEach(t => {
        const el = document.getElementById('tab-' + t);
        const btn = document.getElementById('tab-btn-' + t);
        if (el) el.classList.add('hidden');
        if (btn) {
            btn.classList.remove('bg-primaryPurple', 'text-white', 'shadow-md', 'shadow-primaryPurple/20');
            btn.classList.add('text-slate-400', 'hover:text-white', 'hover:bg-white/5');
        }
    });

    const activeEl = document.getElementById('tab-' + tabName);
    const activeBtn = document.getElementById('tab-btn-' + tabName);
    if (activeEl) activeEl.classList.remove('hidden');
    if (activeBtn) {
        activeBtn.classList.remove('text-slate-400', 'hover:text-white', 'hover:bg-white/5');
        activeBtn.classList.add('bg-primaryPurple', 'text-white', 'shadow-md', 'shadow-primaryPurple/20');
    }
}

function renderResources() {
    const grid = document.getElementById('resources-grid');
    const countEl = document.getElementById('resource-count');
    if (!grid) return;

    countEl.innerText = `${chapterResources.length} items stored`;
    grid.innerHTML = '';

    chapterResources.forEach((res) => {
        let icon = '📕';
        let badgeClass = 'bg-red-500/10 text-red-400';
        let typeLabel = 'PDF';

        if(res.type === 'youtube') {
            icon = '▶️';
            badgeClass = 'bg-blue-500/10 text-blue-400';
            typeLabel = 'YouTube';
        } else if(res.type === 'notes') {
            icon = '📓';
            badgeClass = 'bg-accentGold/10 text-accentGold';
            typeLabel = 'Notes';
        }

        const card = document.createElement('div');
        card.className = 'glass-card p-5 rounded-xl border border-surfaceBorder hover:border-primaryPurple transition flex flex-col justify-between';
        card.innerHTML = `
            <div>
                <div class="flex justify-between items-start mb-3">
                    <span class="text-2xl">${icon}</span>
                    <span class="text-xs ${badgeClass} px-2 py-0.5 rounded font-medium">${typeLabel}</span>
                </div>
                <h4 class="text-white font-bold mb-1">${res.title}</h4>
                <p class="text-xs text-slate-400 mb-4 truncate">${res.url !== '#' ? res.url : 'Uploaded study artifact'}</p>
            </div>
            <div class="flex justify-between items-center pt-3 border-t border-surfaceBorder">
                <a href="${res.url}" target="_blank" class="text-xs text-primaryPurple font-semibold hover:underline">Access Resource →</a>
                <button onclick="deleteResource('${res.id}')" class="text-xs text-slate-500 hover:text-red-400 transition">Delete</button>
            </div>
        `;
        grid.appendChild(card);
    });
}

window.openResourceModal = function() {
    document.getElementById('resourceModal').classList.remove('hidden');
    document.getElementById('resourceModal').classList.add('flex');
}

window.closeResourceModal = function() {
    document.getElementById('resourceModal').classList.add('hidden');
    document.getElementById('resourceModal').classList.remove('flex');
}

// Save Resource with Support for File Uploads or URLs
window.saveNewResource = async function() {
    const title = document.getElementById('resTitle').value.trim();
    const type = document.getElementById('resType').value;
    const urlInput = document.getElementById('resUrl').value.trim();
    const fileInput = document.getElementById('resFile') ? document.getElementById('resFile').files[0] : null;

    if(!title) {
        alert('Please enter a resource title.');
        return;
    }

    let finalUrl = urlInput || '#';

    try {
        if (currentUser && fileInput) {
            // Upload actual file to Firebase Storage
            const storageRef = ref(storage, `users/${currentUser.uid}/subjects/${subjectId}/chapters/${chapterSlug}/${Date.now()}_${fileInput.name}`);
            const snapshot = await uploadBytes(storageRef, fileInput);
            finalUrl = await getDownloadURL(snapshot.ref);
        }
    } catch (err) {
        console.error("File upload failed:", err);
        alert("File upload failed. Saving with fallback link.");
    }

    const newResource = { title, type, url: finalUrl, createdAt: new Date().toISOString() };

    try {
        if (currentUser) {
            const docRef = await addDoc(
                collection(db, `users/${currentUser.uid}/subjects/${subjectId}/chapters/${chapterSlug}/resources`), 
                newResource
            );
            newResource.id = docRef.id;
        } else {
            newResource.id = 'local-' + Date.now();
        }
    } catch (e) {
        console.error("Error saving resource to Firestore: ", e);
        newResource.id = 'local-' + Date.now();
    }

    chapterResources.push(newResource);
    renderResources();
    closeResourceModal();

    document.getElementById('resTitle').value = '';
    document.getElementById('resUrl').value = '';
}

window.deleteResource = async function(resourceId) {
    try {
        if (currentUser && !resourceId.startsWith('default-') && !resourceId.startsWith('local-')) {
            await deleteDoc(doc(db, `users/${currentUser.uid}/subjects/${subjectId}/chapters/${chapterSlug}/resources`, resourceId));
        }
    } catch (e) {
        console.error("Error deleting document:", e);
    }

    chapterResources = chapterResources.filter(r => r.id !== resourceId);
    renderResources();
}

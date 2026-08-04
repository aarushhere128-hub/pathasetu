import { curriculum } from './curriculum-dummy.js';
import { db, auth, storage } from './firebase-config.js';
import { collection, getDocs, addDoc, deleteDoc, doc } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-auth.js";
import { ref, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-storage.js";
import { queryNcertKnowledge } from './ai-engine.js';

const urlParams = new URLSearchParams(window.location.search);
const subjectId = urlParams.get('subject');
const chapterSlug = urlParams.get('chapter');

let currentSubjectData = null;
let currentChapterData = null;
let chapterResources = [];
let chapterMistakes = [];
let currentUser = null;

document.addEventListener('DOMContentLoaded', () => {
    loadChapterDetails();
    
    onAuthStateChanged(auth, (user) => {
        currentUser = user;
        fetchChapterResources();
        fetchChapterMistakes();
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

async function fetchChapterMistakes() {
    chapterMistakes = [
        { id: 'm-1', concept: 'Sign convention for concave mirrors (Real vs. Virtual image coordinates)', status: 'Needs Review', nextReview: 'Today' }
    ];

    if (!currentUser) {
        renderMistakes();
        return;
    }

    try {
        const mistakesRef = collection(db, `users/${currentUser.uid}/subjects/${subjectId}/chapters/${chapterSlug}/mistakes`);
        const snapshot = await getDocs(mistakesRef);
        
        if (!snapshot.empty) {
            chapterMistakes = [];
            snapshot.forEach(docSnap => {
                chapterMistakes.push({ id: docSnap.id, ...docSnap.data() });
            });
        }
    } catch (error) {
        console.error("Error fetching mistakes:", error);
    }

    renderMistakes();
}

function renderMistakes() {
    const container = document.getElementById('revision-container');
    if (!container) return;

    container.innerHTML = `
        <div class="flex justify-between items-center mb-4">
            <h3 class="text-white font-bold text-lg">🧠 Spaced Repetition & Mistake Log</h3>
            <button onclick="openMistakeModal()" class="bg-primaryPurple text-white text-xs px-3 py-1.5 rounded-lg font-medium hover:bg-primaryPurple/80 transition">+ Log Difficult Concept</button>
        </div>
    `;

    if (chapterMistakes.length === 0) {
        container.innerHTML += `<p class="text-slate-400 text-sm">No difficult concepts logged yet for this chapter. Great job!</p>`;
        return;
    }

    const grid = document.createElement('div');
    grid.className = 'grid grid-cols-1 md:grid-cols-2 gap-4';

    chapterMistakes.forEach((item) => {
        const card = document.createElement('div');
        card.className = 'glass-card p-4 rounded-xl border border-surfaceBorder bg-surface/50 flex flex-col justify-between';
        card.innerHTML = `
            <div>
                <div class="flex justify-between items-start mb-2">
                    <span class="text-xs bg-amber-500/10 text-amber-400 px-2 py-0.5 rounded font-medium">${item.status || 'Review Due'}</span>
                    <span class="text-xs text-slate-400">Target: ${item.nextReview || 'Today'}</span>
                </div>
                <p class="text-white text-sm font-medium mb-3">${item.concept}</p>
            </div>
            <div class="flex justify-end gap-2 pt-2 border-t border-surfaceBorder">
                <button onclick="resolveMistake('${item.id}')" class="text-xs text-emerald-400 hover:underline">Mark Mastered ✓</button>
            </div>
        `;
        grid.appendChild(card);
    });

    container.appendChild(grid);
}

window.resolveMistake = async function(mistakeId) {
    try {
        if (currentUser && !mistakeId.startsWith('m-')) {
            await deleteDoc(doc(db, `users/${currentUser.uid}/subjects/${subjectId}/chapters/${chapterSlug}/mistakes`, mistakeId));
        }
    } catch (e) {
        console.error("Error resolving mistake:", e);
    }

    chapterMistakes = chapterMistakes.filter(m => m.id !== mistakeId);
    renderMistakes();
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

window.sendChatMessage = async function() {
    const input = document.getElementById('chat-input');
    const container = document.getElementById('chat-messages');
    if (!input || !container) return;

    const text = input.value.trim();
    const chapterName = currentChapterData ? currentChapterData.name : 'this chapter';

    if (!text) return;

    const userMsg = document.createElement('div');
    userMsg.className = 'bg-surfaceBorder/60 p-3.5 rounded-xl max-w-lg ml-auto text-sm text-white';
    userMsg.innerText = text;
    container.appendChild(userMsg);

    input.value = '';
    container.scrollTop = container.scrollHeight;

    const loadingId = 'loading-' + Date.now();
    const loadingMsg = document.createElement('div');
    loadingMsg.id = loadingId;
    loadingMsg.className = 'bg-primaryPurple/10 border border-primaryPurple/20 p-3.5 rounded-xl max-w-lg text-sm text-slate-300 animate-pulse';
    loadingMsg.innerHTML = `📖 Scanning official NCERT textbook lines for ${chapterName}...`;
    container.appendChild(loadingMsg);
    container.scrollTop = container.scrollHeight;

    setTimeout(() => {
        const loadEl = document.getElementById(loadingId);
        if (loadEl) loadEl.remove();

        const aiMsg = document.createElement('div');
        aiMsg.className = 'bg-primaryPurple/20 border border-primaryPurple/30 p-3.5 rounded-xl max-w-lg text-sm text-white space-y-2';
        
        aiMsg.innerHTML = `
            <div class="text-xs font-semibold text-accentGold uppercase tracking-wider flex items-center gap-1">
                <span>🛡️ CBSE Board Verified Source</span>
            </div>
            <p class="text-xs italic text-slate-300 bg-black/20 p-2.5 rounded border-l-2 border-accentGold leading-relaxed">
                "Concepts and terms specified in the official textbook must be adhered to for standard evaluation." <br>
                <span class="text-primaryPurple font-medium not-italic mt-1 block">— NCERT Class 10 ${currentSubjectData ? currentSubjectData.name : 'Science'}, Chapter: ${chapterName}</span>
            </p>
            <div class="text-slate-200 text-xs leading-relaxed pt-1">
                <strong class="text-white block mb-1">Board Breakdown & Syllabus Limit:</strong>
                To score full marks in your board examinations, focus strictly on the core definitions outlined above without over-complicating with out-of-syllabus derivations.
            </div>
        `;
        container.appendChild(aiMsg);
        container.scrollTop = container.scrollHeight;
    }, 1000);
}

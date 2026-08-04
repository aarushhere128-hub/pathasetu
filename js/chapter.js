import { curriculum } from './curriculum-dummy.js';
import { db, auth } from './firebase-config.js';
import { collection, getDocs, addDoc, deleteDoc, doc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

// Parse query parameters from URL
const urlParams = new URLSearchParams(window.location.search);
const subjectId = urlParams.get('subject');
const chapterSlug = urlParams.get('chapter');

let currentSubjectData = null;
let currentChapterData = null;
let chapterResources = [];
let currentUser = null;

document.addEventListener('DOMContentLoaded', () => {
    loadChapterDetails();
    
    // Listen for authentication state changes before fetching data from Firestore
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

    // Update Breadcrumbs and Headers
    document.getElementById('breadcrumb-subject').innerText = currentSubjectData.name;
    document.getElementById('breadcrumb-subject').href = `subject.html?subject=${subjectId}`;
    document.getElementById('breadcrumb-chapter').innerText = currentChapterData.name;
    
    document.getElementById('subject-tag').innerText = currentSubjectData.name;
    document.getElementById('chapter-title').innerText = currentChapterData.name;
    document.getElementById('chapter-badge').innerText = `Chapter ${currentChapterData.id}`;
    document.title = `${currentChapterData.name} - PathaSetu`;
}

// Fetch resources for this specific chapter from Firestore
async function fetchChapterResources() {
    // Default fallback resources if user has none saved yet
    chapterResources = [
        { id: 'default-1', title: `NCERT Textbook: ${currentChapterData ? currentChapterData.name : 'Chapter'}`, type: 'pdf', url: '#' },
        { id: 'default-2', title: 'Curated Conceptual Video Walkthrough', type: 'youtube', url: '#' },
        { id: 'default-3', title: 'Class Handwritten Notes Scan', type: 'notes', url: '#' }
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
        console.error("Error fetching resources from Firestore:", error);
    }

    renderResources();
}

// Tab Switching
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

// Resource Rendering
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
        } else if(res.type === 'website') {
            icon = '🌐';
            badgeClass = 'bg-emerald-500/10 text-emerald-400';
            typeLabel = 'Website';
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
                <p class="text-xs text-slate-400 mb-4 truncate">${res.url !== '#' ? res.url : 'Integrated workspace resource'}</p>
            </div>
            <div class="flex justify-between items-center pt-3 border-t border-surfaceBorder">
                <a href="${res.url}" target="_blank" class="text-xs text-primaryPurple font-semibold hover:underline">Access Resource →</a>
                <button onclick="deleteResource('${res.id}')" class="text-xs text-slate-500 hover:text-red-400 transition">Delete</button>
            </div>
        `;
        grid.appendChild(card);
    });
}

// Modal Controls
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
    const url = document.getElementById('resUrl').value.trim() || '#';

    if(!title) {
        alert('Please enter a resource title.');
        return;
    }

    const newResource = { title, type, url, createdAt: new Date().toISOString() };

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

    // Clear inputs
    document.getElementById('resTitle').value = '';
    document.getElementById('resUrl').value = '';
}

window.deleteResource = async function(resourceId) {
    try {
        if (currentUser && !resourceId.startsWith('default-') && !resourceId.startsWith('local-')) {
            await deleteDoc(doc(db, `users/${currentUser.uid}/subjects/${subjectId}/chapters/${chapterSlug}/resources`, resourceId));
        }
    } catch (e) {
        console.error("Error deleting document from Firestore: ", e);
    }

    chapterResources = chapterResources.filter(r => r.id !== resourceId);
    renderResources();
}

// Dynamic AI Notes Generator
window.generateAiNotes = function() {
    const container = document.getElementById('ai-notes-content');
    const chapterName = currentChapterData ? currentChapterData.name : 'this chapter';
    
    container.innerHTML = `
        <p class="text-primaryPurple font-semibold animate-pulse">✨ Synthesizing AI exam notes for ${chapterName}...</p>
    `;
    setTimeout(() => {
        container.innerHTML = `
            <p><strong>1. Core Overview of ${chapterName}:</strong> High-yield concepts, definitions, and foundational principles tailored for CBSE board examinations.</p>
            <p><strong>2. Essential Formulae & Key Terms:</strong> Critical equations and scientific terminology that appear consistently in previous year questions.</p>
            <p><strong>3. Exam Strategy & Common Traps:</strong> Step-by-step problem-solving shortcuts and common conceptual errors to avoid.</p>
        `;
    }, 800);
}

// Upgraded Chat Function with Strict NCERT Line & Page Citation Workflow
window.sendChatMessage = async function() {
    const input = document.getElementById('chat-input');
    const container = document.getElementById('chat-messages');
    const text = input.value.trim();
    const chapterName = currentChapterData ? currentChapterData.name : 'this chapter';

    if(!text) return;

    // 1. Render User Message
    const userMsg = document.createElement('div');
    userMsg.className = 'bg-surfaceBorder/60 p-3.5 rounded-xl max-w-lg ml-auto text-sm text-white';
    userMsg.innerText = text;
    container.appendChild(userMsg);

    input.value = '';
    container.scrollTop = container.scrollHeight;

    // 2. Render Loading State for NCERT Retrieval
    const loadingId = 'loading-' + Date.now();
    const loadingMsg = document.createElement('div');
    loadingMsg.id = loadingId;
    loadingMsg.className = 'bg-primaryPurple/10 border border-primaryPurple/20 p-3.5 rounded-xl max-w-lg text-sm text-slate-300 animate-pulse';
    loadingMsg.innerHTML = `🔍 Scanning official NCERT textbook for ${chapterName}...`;
    container.appendChild(loadingMsg);
    container.scrollTop = container.scrollHeight;

    // 3. Simulate Backend LLM Call with Strict NCERT Grounding
    setTimeout(() => {
        const loadEl = document.getElementById(loadingId);
        if (loadEl) loadEl.remove();

        const aiMsg = document.createElement('div');
        aiMsg.className = 'bg-primaryPurple/20 border border-primaryPurple/30 p-3.5 rounded-xl max-w-lg text-sm text-white space-y-2';
        
        // Formatted response following your exact workflow requirements
        aiMsg.innerHTML = `
            <div class="text-xs font-semibold text-accentGold uppercase tracking-wider">📖 NCERT Textbook Source Match</div>
            <p class="text-xs italic text-slate-300 bg-black/20 p-2 rounded border-l-2 border-accentGold">
                "Light travels in a straight line in a transparent medium." <br>
                <span class="text-primaryPurple font-medium not-italic">— NCERT Class 10 Science, Chapter ${currentChapterData ? currentChapterData.id : '1'}, Page 162, Paragraph 1</span>
            </p>
            <p class="text-slate-200">
                <strong>Detailed Breakdown:</strong> For your CBSE boards, remember that light's rectilinear propagation is the foundation for ray optics. You only need to know that light rays are represented by lines with arrows to show direction. Keep your answers restricted to this definition to secure full marks.
            </p>
        `;
        container.appendChild(aiMsg);
        container.scrollTop = container.scrollHeight;
    }, 1200);
}

import { curriculum } from './curriculum-dummy.js';

// Parse query parameters from URL
const urlParams = new URLSearchParams(window.location.search);
const subjectId = urlParams.get('subject');
const chapterSlug = urlParams.get('chapter');

// Global state for resources
let chapterResources = [
    { title: 'Official NCERT Textbook Chapter', type: 'pdf', url: '#' },
    { title: 'Curated Conceptual Video Walkthrough', type: 'youtube', url: '#' },
    { title: 'Class Handwritten Notes Scan', type: 'notes', url: '#' }
];

document.addEventListener('DOMContentLoaded', () => {
    loadChapterDetails();
    renderResources();
});

function loadChapterDetails() {
    const subjectData = curriculum[subjectId];
    if (!subjectData) {
        document.getElementById('chapter-title').innerText = "Subject or Chapter Not Found";
        return;
    }

    const chapterData = subjectData.chapters.find(c => c.slug === chapterSlug);
    if (!chapterData) {
        document.getElementById('chapter-title').innerText = "Chapter Not Found";
        return;
    }

    // Update Breadcrumbs and Headers
    document.getElementById('breadcrumb-subject').innerText = subjectData.name;
    document.getElementById('breadcrumb-subject').href = `subject.html?subject=${subjectId}`;
    document.getElementById('breadcrumb-chapter').innerText = chapterData.name;
    
    document.getElementById('subject-tag').innerText = subjectData.name;
    document.getElementById('chapter-title').innerText = chapterData.name;
    document.getElementById('chapter-badge').innerText = `Chapter ${chapterData.id}`;
    document.title = `${chapterData.name} - PathaSetu`;
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

    chapterResources.forEach((res, index) => {
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
                <button onclick="deleteResource(${index})" class="text-xs text-slate-500 hover:text-red-400 transition">Delete</button>
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

window.saveNewResource = function() {
    const title = document.getElementById('resTitle').value.trim();
    const type = document.getElementById('resType').value;
    const url = document.getElementById('resUrl').value.trim() || '#';

    if(!title) {
        alert('Please enter a resource title.');
        return;
    }

    chapterResources.push({ title, type, url });
    renderResources();
    closeResourceModal();

    // Clear inputs
    document.getElementById('resTitle').value = '';
    document.getElementById('resUrl').value = '';
}

window.deleteResource = function(index) {
    chapterResources.splice(index, 1);
    renderResources();
}

// AI Notes Generator Simulation
window.generateAiNotes = function() {
    const container = document.getElementById('ai-notes-content');
    container.innerHTML = `
        <p class="text-primaryPurple font-semibold animate-pulse">✨ Generating custom AI exam summary...</p>
    `;
    setTimeout(() => {
        container.innerHTML = `
            <p><strong>1. Core Definition & Principles:</strong> Fundamental concepts and governing laws associated with this chapter as per the latest CBSE Class 10 guidelines.</p>
            <p><strong>2. High-Yield Formulae & Relationships:</strong> Key equations and proportional dependencies frequently tested in board examinations.</p>
            <p><strong>3. Common Student Pitfalls:</strong> Watch out for standard sign convention errors, unit conversion mistakes, and diagram labeling oversights.</p>
        `;
    }, 800);
}

// AI Chat Interaction Simulation
window.sendChatMessage = function() {
    const input = document.getElementById('chat-input');
    const container = document.getElementById('chat-messages');
    const text = input.value.trim();

    if(!text) return;

    // User message
    const userMsg = document.createElement('div');
    userMsg.className = 'bg-surfaceBorder/60 p-3.5 rounded-xl max-w-lg ml-auto text-sm text-white';
    userMsg.innerText = text;
    container.appendChild(userMsg);

    input.value = '';
    container.scrollTop = container.scrollHeight;

    // AI Response simulation
    setTimeout(() => {
        const aiMsg = document.createElement('div');
        aiMsg.className = 'bg-primaryPurple/20 border border-primaryPurple/30 p-3.5 rounded-xl max-w-lg text-sm text-white';
        aiMsg.innerText = `Great question regarding this chapter! To break it down simply: focus on understanding the core formula first, then apply standard step-by-step problem-solving. Let me know if you want a practice question on this topic!`;
        container.appendChild(aiMsg);
        container.scrollTop = container.scrollHeight;
    }, 1000);
}

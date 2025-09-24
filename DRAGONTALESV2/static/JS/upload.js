// Utility functions
function getCookie(cname) {
  let name = cname + "=";
  let decodedCookie = decodeURIComponent(document.cookie);
  let ca = decodedCookie.split(';');
  for(let i = 0; i <ca.length; i++) {
    let c = ca[i];
    while (c.charAt(0) == ' ') {
      c = c.substring(1);
    }
    if (c.indexOf(name) == 0) {
      return c.substring(name.length, c.length);
    }
  }
  return "";
}

// Add keyboard shortcuts
document.addEventListener('keydown', (e) => {
    if (e.ctrlKey || e.metaKey) {
        switch(e.key) {
            case 's':
                e.preventDefault();
                document.getElementById('article-form').dispatchEvent(new Event('submit'));
                break;
            case 'p':
                e.preventDefault();
                document.getElementById('preview-btn').click();
                break;
        }
    }
});

document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('article-form');
    const statusMessage = document.getElementById('status-message');
    let quill;

    // Initialize Quill rich text editor
    quill = new Quill('#editor', {
        theme: 'snow',
        modules: {
            toolbar: [
                [{ 'header': [1, 2, 3, false] }],
                ['bold', 'italic', 'underline', 'strike'],
                ['blockquote', 'code-block'],
                [{ 'list': 'ordered'}, { 'list': 'bullet' }],
                [{ 'script': 'sub'}, { 'script': 'super' }],
                [{ 'indent': '-1'}, { 'indent': '+1' }],
                ['link', 'image'],
                ['clean']
            ]
        }
    });

    // Set the date input to today's date by default
    document.getElementById('date').value = new Date().toISOString().split('T')[0];
    
    // Image upload functionality
    const imageFileInput = document.getElementById('image-file');
    const uploadImageBtn = document.getElementById('upload-image-btn');
    const imageUrlInput = document.getElementById('image');
    const imagePreview = document.getElementById('image-preview');
    const previewImg = document.getElementById('preview-img');
    
    uploadImageBtn.addEventListener('click', async () => {
        const file = imageFileInput.files[0];
        if (!file) {
            showStatus('Please select an image file first.', 'error');
            return;
        }
        
        const formData = new FormData();
        formData.append('image', file);
        
        uploadImageBtn.textContent = 'Uploading...';
        uploadImageBtn.disabled = true;
        
        try {
            const response = await fetch('/api/upload-image', {
                method: 'POST',
                body: formData
            });
            
            const result = await response.json();
            
            if (response.ok) {
                imageUrlInput.value = result.url;
                showImagePreview(result.url);
                showStatus('Image uploaded successfully!', 'success');
            } else {
                showStatus(result.message || 'Image upload failed.', 'error');
            }
        } catch (error) {
            console.error('Error uploading image:', error);
            showStatus('Failed to upload image.', 'error');
        } finally {
            uploadImageBtn.textContent = 'Upload Image';
            uploadImageBtn.disabled = false;
        }
    });
    
    // Image URL input change handler
    imageUrlInput.addEventListener('input', (e) => {
        const url = e.target.value;
        if (url) {
            showImagePreview(url);
        } else {
            hideImagePreview();
        }
    });
    
    function showImagePreview(url) {
        previewImg.src = url;
        imagePreview.classList.remove('hidden');
    }
    
    function hideImagePreview() {
        imagePreview.classList.add('hidden');
        previewImg.src = '';
    }
    
    // Preview functionality
    const previewBtn = document.getElementById('preview-btn');
    const previewModal = document.getElementById('preview-modal');
    const closePreview = document.getElementById('close-preview');
    const previewContent = document.getElementById('preview-content');
    
    previewBtn.addEventListener('click', () => {
        const articleData = getFormData();
        if (!articleData) return;
        
        previewContent.innerHTML = `
            <div class="bg-white rounded-lg p-6">
                <h1 class="text-3xl font-bold text-gray-900 mb-4">${articleData.title}</h1>
                <div class="flex justify-between items-center mb-4">
                    <p class="text-gray-600">By ${articleData.author}</p>
                    <p class="text-gray-500 text-sm">${articleData.date}</p>
                </div>
                <img src="${articleData.image}" alt="${articleData.title}" class="w-full max-h-64 object-cover rounded-lg mb-4" onerror="this.style.display='none'">
                <div class="prose max-w-none">
                    <p class="text-lg text-gray-700 mb-4">${articleData.summary}</p>
                    <div class="text-gray-800">${articleData.fullDescription}</div>
                </div>
            </div>
        `;
        previewModal.classList.remove('hidden');
    });
    
    closePreview.addEventListener('click', () => {
        previewModal.classList.add('hidden');
    });
    
    // Close modal when clicking outside
    previewModal.addEventListener('click', (e) => {
        if (e.target === previewModal) {
            previewModal.classList.add('hidden');
        }
    });
    
    function getFormData() {
        const title = form.elements.title.value.trim();
        const author = form.elements.author.value.trim();
        const category = form.elements.category.value.trim();
        const image = document.getElementById('image').value.trim();
        const summary = form.elements.summary.value.trim();
        const editorContent = quill.root.innerHTML;
        
        if (!title || !author || !category || !summary || !editorContent || editorContent === '<p><br></p>') {
            showStatus('Please fill in all required fields.', 'error');
            return null;
        }
        
        if (!image) {
            showStatus('Please provide an image URL or upload an image file.', 'error');
            return null;
        }
        
        const inputDate = new Date(form.elements.date.value);
        const formattedDate = inputDate.toLocaleDateString('en-US', {
            year: 'numeric', month: 'long', day: 'numeric',
        });
        
        return {
            title,
            author,
            category,
            date: formattedDate,
            image,
            summary,
            fullDescription: editorContent,
            featured: form.elements.featured.checked
        };
    }
    
    function showStatus(message, type) {
        statusMessage.classList.remove('hidden', 'bg-red-200', 'text-red-800', 'bg-green-200', 'text-green-800');
        statusMessage.textContent = message;
        
        if (type === 'success') {
            statusMessage.classList.add('bg-green-200', 'text-green-800');
        } else {
            statusMessage.classList.add('bg-red-200', 'text-red-800');
        }
        
        statusMessage.classList.remove('hidden');
        
        // Auto-hide after 5 seconds
        setTimeout(() => {
            statusMessage.classList.add('hidden');
        }, 5000);
    }

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const articleData = getFormData();
        if (!articleData) return;
        
        // Show loading state
        const submitBtn = document.getElementById('submit-btn');
        const submitText = document.getElementById('submit-text');
        const submitLoading = document.getElementById('submit-loading');
        
        submitBtn.disabled = true;
        submitText.classList.add('hidden');
        submitLoading.classList.remove('hidden');
        
        // Create a unique ID
        const titleForId = articleData.title.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
        const uniqueId = `${titleForId}-${Date.now()}`;
        
        // Update hidden textarea with Quill content
        document.getElementById('fullDescription').value = quill.root.innerHTML;
        
        const newArticle = {
            id: uniqueId,
            ...articleData,
            views: 0
        };
        
        try {
            const response = await fetch('/api/upload', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newArticle)
            });
            
            const result = await response.json();
            
            if (response.ok) {
                showStatus(result.message, 'success');
                form.reset();
                quill.setContents([]);
                hideImagePreview();
                document.getElementById('date').value = new Date().toISOString().split('T')[0];
                localStorage.removeItem('article-draft');
            } else {
                showStatus(result.message || 'An unknown error occurred.', 'error');
            }
        } catch (error) {
            console.error('Error submitting article:', error);
            showStatus('Failed to connect to the server.', 'error');
        } finally {
            submitBtn.disabled = false;
            submitText.classList.remove('hidden');
            submitLoading.classList.add('hidden');
        }
    });
    
    // Auto-save functionality
    let autoSaveTimeout;
    function autoSave() {
        clearTimeout(autoSaveTimeout);
        autoSaveTimeout = setTimeout(() => {
            const formData = {
                title: form.elements.title.value,
                author: form.elements.author.value,
                category: form.elements.category.value,
                image: form.elements.image.value,
                summary: form.elements.summary.value,
                content: quill.root.innerHTML,
                featured: form.elements.featured.checked
            };
            localStorage.setItem('article-draft', JSON.stringify(formData));
        }, 2000);
    }
    
    // Load draft on page load
    const savedDraft = localStorage.getItem('article-draft');
    if (savedDraft) {
        try {
            const draft = JSON.parse(savedDraft);
            form.elements.title.value = draft.title || '';
            form.elements.author.value = draft.author || '';
            form.elements.category.value = draft.category || '';
            form.elements.image.value = draft.image || '';
            form.elements.summary.value = draft.summary || '';
            form.elements.featured.checked = draft.featured || false;
            if (draft.content) {
                quill.root.innerHTML = draft.content;
            }
            if (draft.image) {
                showImagePreview(draft.image);
            }
        } catch (e) {
            console.error('Error loading draft:', e);
        }
    }
    
    // Add auto-save listeners
    ['input', 'change'].forEach(event => {
        form.addEventListener(event, autoSave);
    });
    quill.on('text-change', autoSave);
});
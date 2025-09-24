document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('artwork-form');
    const imageFileInput = document.getElementById('image-file');
    const imageUrlInput = document.getElementById('image-url');
    const uploadImageBtn = document.getElementById('upload-image-btn');
    const imagePreview = document.getElementById('image-preview');
    const previewImg = document.getElementById('preview-img');
    const submitBtn = document.getElementById('submit-btn');
    const submitText = document.getElementById('submit-text');
    const submitLoading = document.getElementById('submit-loading');
    const statusMessage = document.getElementById('status-message');

    let uploadedImageUrl = '';

    // Handle image file upload
    uploadImageBtn.addEventListener('click', async function() {
        const file = imageFileInput.files[0];
        if (!file) {
            showMessage('Please select an image file first.', 'error');
            return;
        }

        const formData = new FormData();
        formData.append('image', file);

        try {
            uploadImageBtn.textContent = 'Uploading...';
            uploadImageBtn.disabled = true;

            const response = await fetch('/api/upload-image', {
                method: 'POST',
                body: formData
            });

            const result = await response.json();

            if (result.success) {
                uploadedImageUrl = result.url;
                previewImg.src = result.url;
                imagePreview.classList.remove('hidden');
                showMessage('Image uploaded successfully!', 'success');
            } else {
                showMessage(result.message || 'Failed to upload image.', 'error');
            }
        } catch (error) {
            showMessage('Error uploading image. Please try again.', 'error');
        } finally {
            uploadImageBtn.textContent = 'Upload Image';
            uploadImageBtn.disabled = false;
        }
    });

    // Handle URL input preview
    imageUrlInput.addEventListener('input', function() {
        const url = this.value.trim();
        if (url && isValidImageUrl(url)) {
            previewImg.src = url;
            imagePreview.classList.remove('hidden');
            uploadedImageUrl = url;
        } else {
            imagePreview.classList.add('hidden');
            uploadedImageUrl = '';
        }
    });

    // Handle form submission
    form.addEventListener('submit', async function(e) {
        e.preventDefault();

        const title = document.getElementById('title').value.trim();
        const creator = document.getElementById('creator').value.trim();
        const description = document.getElementById('description').value.trim();
        const imageUrl = uploadedImageUrl || imageUrlInput.value.trim();

        if (!title || !creator || !imageUrl) {
            showMessage('Please fill in all required fields and provide an image.', 'error');
            return;
        }

        const artworkData = {
            title: title,
            creator: creator,
            description: description,
            url: imageUrl,
            uploadDate: new Date().toISOString().split('T')[0]
        };

        try {
            submitText.classList.add('hidden');
            submitLoading.classList.remove('hidden');
            submitBtn.disabled = true;

            const response = await fetch('/api/upload-artwork', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(artworkData)
            });

            const result = await response.json();

            if (result.success) {
                showMessage('Artwork uploaded successfully!', 'success');
                form.reset();
                imagePreview.classList.add('hidden');
                uploadedImageUrl = '';
                
                // Redirect to art gallery after 2 seconds
                setTimeout(() => {
                    window.location.href = '/art';
                }, 2000);
            } else {
                showMessage(result.message || 'Failed to upload artwork.', 'error');
            }
        } catch (error) {
            showMessage('Error uploading artwork. Please try again.', 'error');
        } finally {
            submitText.classList.remove('hidden');
            submitLoading.classList.add('hidden');
            submitBtn.disabled = false;
        }
    });

    function isValidImageUrl(url) {
        return /\.(jpg|jpeg|png|gif|webp)$/i.test(url);
    }

    function showMessage(message, type) {
        statusMessage.textContent = message;
        statusMessage.className = `mt-6 p-4 rounded-lg text-center font-semibold ${
            type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
        }`;
        statusMessage.classList.remove('hidden');
        
        setTimeout(() => {
            statusMessage.classList.add('hidden');
        }, 5000);
    }
});
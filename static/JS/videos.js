// Video page functionality - because everyone wants to be a content creator
let videos = []; // Our collection of digital masterpieces
async function checkLogin() {
            try {
                const response = await fetch('/api/check-login');
                const result = await response.json();
                if (result.logged_in) {
                    return true;
                } else {
                    return false;
                }
            } catch (error) {
                return false;
            }
        }
function createVideoCard(video) {
    // Checking if it's our video or someone else's problem
    const isLocalVideo = video.url.startsWith('/VIDEOS/');
    // Using custom thumbnail or falling back to the classic "Video" placeholder
    const thumbnailUrl = video.thumbnail || 'https://placehold.co/480x270/cccccc/ffffff?text=Video';
    
    // Building HTML like we're constructing a house of cards (we are)
    return `
        <div class="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
            <div class="relative">
                <img src="${thumbnailUrl}" alt="${video.title}" class="w-full h-48 object-cover" onerror="this.src='https://placehold.co/480x270/cccccc/ffffff?text=Video'">
                <div class="absolute inset-0 flex items-center justify-center">
                    <button onclick="playVideo('${video.url}', ${isLocalVideo})" class="bg-red-600 text-white rounded-full p-3 hover:bg-red-700 transition-colors">
                        <svg class="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M8 5v10l8-5-8-5z"/>
                        </svg>
                    </button>
                </div>
            </div>
            <div class="p-4">
                <h3 class="font-semibold text-lg mb-2">${video.title}</h3>
                <p class="text-gray-600 text-sm mb-2">${video.description}</p>
                <p class="text-gray-500 text-xs">${video.date}</p>
            </div>
        </div>
    `;
}

function playVideo(url, isLocal) {
    // Time for the main event - actually watching the video *gasp*
    if (isLocal) {
        // Creating a fancy modal because we're classy
        const modal = document.createElement('div');
        modal.className = 'fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50';
        modal.innerHTML = `
            <div class="relative max-w-4xl w-full mx-4">
                <button onclick="this.parentElement.parentElement.remove()" class="absolute -top-10 right-0 text-white text-2xl">&times;</button>
                <video controls class="w-full">
                    <source src="${url}" type="video/mp4">
                    Your browser does not support the video tag. Time to upgrade from Internet Explorer.
                </video>
            </div>
        `;
        document.body.appendChild(modal); // Adding it to the DOM like a responsible developer
    } else {
        // Not our video? Not our problem. Send them elsewhere.
        window.open(url, '_blank');
    }
}

function renderVideos() {
    const grid = document.getElementById('videos-grid');
    if (videos.length === 0) {
        grid.innerHTML = '<p class="text-gray-500 text-center col-span-full">No videos available.</p>';
        return;
    }
    grid.innerHTML = videos.map(video => createVideoCard(video)).join('');
}

function checkLoginStatus() {
    fetch('/api/check-login')
        .then(response => response.json())
        .then(data => {
            if (data.logged_in) {
                document.getElementById('upload-btn').style.display = 'block';
            }
        })
        .catch(() => {});
}

document.addEventListener('DOMContentLoaded', () => {
    showLoading();
    checkLoginStatus();
    
    // Load videos
    fetch('/api/videos')
        .then(response => response.json())
        .then(data => {
            videos = data.videos || [];
            renderVideos();
        })
        .catch(error => {
            console.error('Error loading videos:', error);
            document.getElementById('videos-grid').innerHTML = '<p class="text-red-500 text-center col-span-full">Error loading videos.</p>';
        })
        .finally(() => {
            hideLoading();
        });

    // Upload modal handlers
    const uploadBtn = document.getElementById('upload-btn');
    const uploadModal = document.getElementById('upload-modal');
    const cancelBtn = document.getElementById('cancel-upload');
    const videoForm = document.getElementById('video-form');

    if (uploadBtn) {
        if (!checkLogin()){
            uploadBtn.classList.add('hidden');
        }
        uploadBtn.addEventListener('click', () => {
            uploadModal.classList.remove('hidden');
        });
    }

    if (cancelBtn) {
        cancelBtn.addEventListener('click', () => {
            uploadModal.classList.add('hidden');
            videoForm.reset();
        });
    }

    if (videoForm) {
        videoForm.addEventListener('submit', (e) => {
            e.preventDefault();
            
            const title = document.getElementById('video-title').value;
            const description = document.getElementById('video-description').value;
            const fileInput = document.getElementById('video-file');
            const urlInput = document.getElementById('video-url').value;
            
            if (!fileInput.files[0] && !urlInput) {
                alert('Please either select a video file or provide a YouTube URL');
                return;
            }

            if (fileInput.files[0]) {
                const formData = new FormData();
                formData.append('video', fileInput.files[0]);
                formData.append('title', title);
                formData.append('description', description);

                fetch('/api/upload-video', {
                    method: 'POST',
                    body: formData
                })
                .then(response => response.json())
                .then(data => {
                    if (data.success) {
                        location.reload();
                    } else {
                        alert('Error uploading video: ' + data.message);
                    }
                })
                .catch(error => {
                    console.error('Upload error:', error);
                    alert('Error uploading video');
                });
            } else {
                const videoData = {
                    id: Date.now().toString(),
                    title,
                    description,
                    url: urlInput,
                    date: new Date().toLocaleDateString()
                };

                fetch('/api/upload-youtube-video', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(videoData)
                })
                .then(response => response.json())
                .then(data => {
                    if (data.success) {
                        location.reload();
                    } else {
                        alert('Error uploading video: ' + data.message);
                    }
                })
                .catch(error => {
                    console.error('Upload error:', error);
                    alert('Error uploading video');
                });
            }
        });
    }
});
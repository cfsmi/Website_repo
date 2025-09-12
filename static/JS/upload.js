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
document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('article-form');
    const statusMessage = document.getElementById('status-message');

    // Set the date input to today's date by default
    document.getElementById('date').value = new Date().toISOString().split('T')[0];

    form.addEventListener('submit', async (e) => {
        e.preventDefault(); // Prevent default form submission

        // Create a unique ID
        const titleForId = form.elements.title.value.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
        const uniqueId = `${titleForId}-${Date.now()}`;

        // Format the date nicely
        const inputDate = new Date(form.elements.date.value);
        const formattedDate = inputDate.toLocaleDateString('en-US', {
            year: 'numeric', month: 'long', day: 'numeric',
        });

        // Construct the article object to send to the server
        const newArticle = {
            id: uniqueId,
            title: form.elements.title.value,
            category: form.elements.category.value,
            date: formattedDate,
            image: form.elements.image.value,
            summary: form.elements.summary.value,
            fullDescription: form.elements.fullDescription.value,
            author: form.elements.author.value,
            featured: form.elements.featured.checked
        };

        // --- Send Data to the Server ---
        try {
            const response = await fetch('/api/upload', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newArticle)
            });

            const result = await response.json();
            
            statusMessage.classList.remove('hidden', 'bg-red-200', 'text-red-800', 'bg-green-200', 'text-green-800');

            if (response.ok) {
                statusMessage.textContent = result.message;
                statusMessage.classList.add('bg-green-200', 'text-green-800');
                form.reset(); // Clear the form on success
                document.getElementById('date').value = new Date().toISOString().split('T')[0]; // Reset date
            } else {
                statusMessage.textContent = result.message || 'An unknown error occurred.';
                statusMessage.classList.add('bg-red-200', 'text-red-800');
            }
        } catch (error) {
            console.error('Error submitting article:', error);
            statusMessage.textContent = 'Failed to connect to the server.';
            statusMessage.classList.add('bg-red-200', 'text-red-800');
        } finally {
            statusMessage.classList.remove('hidden');
        }
    });
});

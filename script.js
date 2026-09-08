document.addEventListener('DOMContentLoaded', () => {
    // Handle Star Ratings
    const starGroups = document.querySelectorAll('.stars');
    
    starGroups.forEach(group => {
        const stars = group.querySelectorAll('i');
        const input = group.querySelector('input');
        
        stars.forEach((star, index) => {
            // Hover effect
            star.addEventListener('mouseover', () => {
                stars.forEach((s, i) => {
                    if (i <= index) s.classList.add('active');
                    else s.classList.remove('active');
                });
            });
            
            // Mouse out effect
            star.addEventListener('mouseout', () => {
                stars.forEach(s => s.classList.remove('active'));
            });
            
            // Click effect
            star.addEventListener('click', () => {
                const value = star.getAttribute('data-value');
                input.value = value;
                
                stars.forEach((s, i) => {
                    if (i <= index) s.classList.add('selected');
                    else s.classList.remove('selected');
                });
                
                // Remove required warning if clicked
                input.setCustomValidity('');
            });
        });
    });

    // Input formatting for Mobile Number (10 digits only)
    const mobileInput = document.getElementById('mobile');
    if (mobileInput) {
        mobileInput.addEventListener('input', e => {
            e.target.value = e.target.value.replace(/\D/g, '').slice(0, 10);
        });
    }

    // Form submission & Modal controls
    const form = document.getElementById('feedbackForm');
    const submitBtn = document.getElementById('submitBtn');
    const modal = document.getElementById('successModal');
    const closeModal = document.querySelector('.close-modal');

    // Google Apps Script Web App URL
    const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbyn2L50usPj6P8sD8uL9baPu8rKriu0a-vKqdia_Bc5hAMtDOtDwaPhboqRXX16234D/exec'; 

    form.addEventListener('submit', e => {
        e.preventDefault();

        // Validate mobile number (10 digits)
        const mobileVal = (form.elements['mobile']?.value || '').trim();
        if (!/^[0-9]{10}$/.test(mobileVal)) {
            alert('Please enter a valid 10-digit mobile number.');
            if (form.elements['mobile']) form.elements['mobile'].focus();
            return;
        }
        
        // Validate star ratings
        let allStarsRated = true;
        document.querySelectorAll('.stars input').forEach(input => {
            if (!input.value) {
                allStarsRated = false;
            }
        });

        if (!allStarsRated) {
            alert('Please provide a rating for all session feedback questions.');
            return;
        }

        submitBtn.disabled = true;
        submitBtn.textContent = 'Submitting...';

        // Prepare form data
        const formData = new FormData(form);
        
        // Handle multiple checkboxes for topics
        const topics = [];
        document.querySelectorAll('input[name="topics"]:checked').forEach(cb => {
            if (cb.value !== 'Other') {
                topics.push(cb.value);
            }
        });
        const otherChecked = document.querySelector('input[name="topics"][value="Other"]')?.checked;
        if (otherChecked) {
            const otherTopic = (document.getElementById('otherTopic')?.value || '').trim();
            topics.push(otherTopic ? `Other: ${otherTopic}` : 'Other');
        }
        formData.set('topics', topics.join(', '));

        // Set mobile number under all common aliases for Google Sheets / Apps Script compatibility
        const mobileAliases = [
            'mobile', 'Mobile', 'MOBILE',
            'mobileNumber', 'MobileNumber', 'Mobile Number', 'mobile_number', 'Mobile_Number',
            'phone', 'Phone', 'PHONE',
            'phoneNumber', 'PhoneNumber', 'Phone Number', 'phone_number', 'Phone_Number',
            'contact', 'Contact', 'whatsapp', 'WhatsApp',
            'q3_mobile', 'q3', '3. Mobile Number', 'Mobile/WhatsApp'
        ];
        mobileAliases.forEach(key => formData.set(key, mobileVal));

        // Rating aliases for backwards and forwards compatibility
        const ratingAliases = [
            ['q5_quality', 'q6_quality'],
            ['q6_clarity', 'q7_clarity'],
            ['q7_speaker', 'q8_speaker'],
            ['q8_relevance', 'q9_relevance'],
            ['q9_examples', 'q10_examples'],
            ['q10_engagement', 'q11_engagement'],
            ['q17_overall', 'q18_overall']
        ];
        ratingAliases.forEach(([oldKey, newKey]) => {
            const val = formData.get(oldKey);
            if (val) formData.set(newKey, val);
        });

        fetch(SCRIPT_URL, {
            method: 'POST',
            body: formData,
            mode: 'no-cors'
        })
        .then(() => {
            modal.style.display = 'flex';
            form.reset();
            // Reset stars
            document.querySelectorAll('.stars i').forEach(s => s.classList.remove('selected'));
            document.querySelectorAll('.stars input').forEach(i => i.value = '');
        })
        .catch(error => {
            console.error('Error!', error.message);
            // Show modal even on offline/network glitch
            modal.style.display = 'flex';
        })
        .finally(() => {
            submitBtn.disabled = false;
            submitBtn.textContent = 'Submit Feedback';
        });
    });

    // Close Modal
    closeModal.addEventListener('click', () => {
        modal.style.display = 'none';
    });

    window.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.style.display = 'none';
        }
    });
});

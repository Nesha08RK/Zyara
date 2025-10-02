// Dropdown menu functionality

document.addEventListener('DOMContentLoaded', function() {
    // Get all dropdown toggles
    const dropdownToggles = document.querySelectorAll('.dropdown-toggle');
    
    // Set initial text to "User" instead of "Role"
    dropdownToggles.forEach(toggle => {
        const toggleText = toggle.querySelector('span');
        if (toggleText && toggleText.textContent === 'Role') {
            toggleText.textContent = 'User';
        }
    });
    
    // Add click event listener to each toggle
    dropdownToggles.forEach(toggle => {
        toggle.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            
            // Toggle dropdown menu visibility
            const dropdownMenu = this.nextElementSibling;
            dropdownMenu.classList.toggle('show');
            
            // Rotate caret icon
            const caretIcon = this.querySelector('.fa-caret-down');
            if (caretIcon) {
                caretIcon.style.transform = dropdownMenu.classList.contains('show') ? 'rotate(180deg)' : 'rotate(0)';
            }
            
            // Close other open dropdowns
            dropdownToggles.forEach(otherToggle => {
                if (otherToggle !== toggle) {
                    const otherMenu = otherToggle.nextElementSibling;
                    if (otherMenu.classList.contains('show')) {
                        otherMenu.classList.remove('show');
                        const otherCaret = otherToggle.querySelector('.fa-caret-down');
                        if (otherCaret) {
                            otherCaret.style.transform = 'rotate(0)';
                        }
                    }
                }
            });
        });
    });
    
    // Close dropdown when clicking outside
    document.addEventListener('click', function(e) {
        dropdownToggles.forEach(toggle => {
            const dropdownMenu = toggle.nextElementSibling;
            if (dropdownMenu.classList.contains('show') && !toggle.contains(e.target)) {
                dropdownMenu.classList.remove('show');
                const caretIcon = toggle.querySelector('.fa-caret-down');
                if (caretIcon) {
                    caretIcon.style.transform = 'rotate(0)';
                }
            }
        });
    });
    
    // Role switching functionality
    const roleItems = document.querySelectorAll('.dropdown-item');
    roleItems.forEach(item => {
        item.addEventListener('click', function(e) {
            e.preventDefault();
            
            // Get the role text
            const roleText = this.querySelector('span:first-of-type').textContent;
            
            // Update the dropdown toggle text
            const dropdownToggle = this.closest('.dropdown').querySelector('.dropdown-toggle span');
            dropdownToggle.textContent = roleText;
            
            // Remove current indicator from all items
            roleItems.forEach(ri => {
                const indicator = ri.querySelector('.role-indicator');
                if (indicator) {
                    indicator.remove();
                }
            });
            
            // Add current indicator to clicked item
            const roleIndicator = document.createElement('span');
            roleIndicator.className = `role-indicator ${roleText.toLowerCase() === 'admin' ? 'role-admin' : 'role-user'}`;
            roleIndicator.textContent = 'Current';
            this.appendChild(roleIndicator);
            
            // Close the dropdown
            this.closest('.dropdown-menu').classList.remove('show');
            const caretIcon = this.closest('.dropdown').querySelector('.fa-caret-down');
            if (caretIcon) {
                caretIcon.style.transform = 'rotate(0)';
            }
            
            // Store the selected role in localStorage
            localStorage.setItem('userRole', roleText);
            
            // You can add additional logic here to handle role-specific functionality
            console.log(`Switched to ${roleText} role`);
        });
    });
    
    // Initialize role from localStorage if available
    const storedRole = localStorage.getItem('userRole');
    if (storedRole) {
        const roleItem = Array.from(roleItems).find(item => 
            item.querySelector('span:first-of-type').textContent === storedRole
        );
        
        if (roleItem) {
            // Simulate a click on the stored role item
            roleItem.click();
        }
    }
});
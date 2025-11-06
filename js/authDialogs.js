
(function ($) {
  $(function () {
   
    function setupDialogs() {
      
      if (!$.ui || !$.ui.dialog) return;

      // ===== VALIDATION SETUP =====
      
      if ($.validator) {
        $.validator.addMethod(
          "emailChars",
          function (value, element) {
            return this.optional(element) || /^[A-Za-z0-9_.@]+$/.test(value);
          },
          "Email can only contain letters, numbers, underscores, periods, and @ symbol"
        );

        
        $.validator.addMethod(
          "emailFormat",
          function (value, element) {
            if (this.optional(element)) return true;

            // Check if email has @ symbol
            if (!value.includes("@")) {
              return false;
            }

            // Check for multiple @ symbols
            if ((value.match(/@/g) || []).length > 1) {
              return false;
            }

           
            const parts = value.split("@");
            if (parts.length !== 2) return false;

            const domain = parts[1];
            if (!domain.includes(".") || domain.split(".").pop().length < 2) {
              return false;
            }

            return true;
          },
          function (value, element) {
            if (!value.includes("@")) {
              return "Email must contain an @ symbol";
            }
            if ((value.match(/@/g) || []).length > 1) {
              return "Email cannot contain multiple @ symbols";
            }
            const parts = value.split("@");
            if (parts.length === 2) {
              const domain = parts[1];
              if (!domain.includes(".") || domain.split(".").pop().length < 2) {
                return "Email must have a valid domain with a top-level domain (e.g., .com, .org)";
              }
            }
            return "Please enter a valid email address";
          }
        );

        // Add custom validation method for phone format
        $.validator.addMethod(
          "phoneFormat",
          function (value, element) {
            return this.optional(element) || /^\d{4}-\d{3}-\d{4}$/.test(value);
          },
          "Please enter phone in format: 0000-000-0000"
        );

        // Add password strength validation with requirements
        $.validator.addMethod(
          "passwordStrength",
          function (value, element) {
            if (this.optional(element)) return true;

            // Check length (8-16 characters)
            if (value.length < 8 || value.length > 16) {
              return false;
            }

            // Check for at least one uppercase letter
            if (!/[A-Z]/.test(value)) {
              return false;
            }

            // Check for at least one lowercase letter
            if (!/[a-z]/.test(value)) {
              return false;
            }

            // Check for at least one digit
            if (!/\d/.test(value)) {
              return false;
            }

            // Check for at least one special character (including ;'\[]/)
            if (!/[!@#$%^&*(),.?":{}|<>\[\];'\/\\]/.test(value)) {
              return false;
            }

            return true;
          },
          "Password must contain at least 8-16 characters with at least one uppercase letter, one lowercase letter, one number, and one special character (!@#$%^&*;'[]/ etc.)"
        );

        // 1.6 - Set default validation settings for Bootstrap compatibility
        $.validator.setDefaults({
          errorClass: "is-invalid",
          validClass: "is-valid",
          errorElement: "div",
          // Custom error placement to use the validate-msg div
          errorPlacement: function (error, element) {
            // Add the error class to the input
            element.addClass("is-invalid").removeClass("is-valid");

            // Find the validate-msg div (specifically target the one with id="validate-msg")
            let $validateMsg = element.closest("form").find("#validate-msg");

            // If validate-msg div exists, use it
            if ($validateMsg && $validateMsg.length) {
              $validateMsg.text(error.text()).removeClass("d-none").show();
            } else {
              // Fallback to original placement if no validate-msg div found
              error.addClass("invalid-feedback");
              if (element.parent(".input-group").length) {
                error.insertAfter(element.parent());
              } else {
                error.insertAfter(element);
              }
            }
          },
          highlight: function (element, errorClass, validClass) {
            $(element).addClass(errorClass).removeClass(validClass);

            // Show the validate-msg div if it exists
            let $validateMsg = $(element).closest("form").find("#validate-msg");
            if ($validateMsg && $validateMsg.length) {
              $validateMsg.removeClass("d-none").show();
            }
          },
          unhighlight: function (element, errorClass, validClass) {
            $(element).removeClass(errorClass).addClass(validClass);

            // Check if there are other errors in the form
            let $form = $(element).closest("form");
            let validator = $form.data("validator") || $form.validate();

            if (validator && validator.numberOfInvalids() === 0) {
              // Hide the validate-msg div if no more errors
              let $validateMsg = $form.find("#validate-msg");
              if ($validateMsg && $validateMsg.length) {
                $validateMsg.addClass("d-none").hide();
              }
            }
          },
        });

        //  Remote check for login email existence 
        $(document).on('blur', '#loginEmail', function () {
          const $el = $(this);
          const email = $el.val().trim();
          const $form = $el.closest('form');
          const $msg = $form.find('#validate-msg');
          if (!email) { $el.data('exists', undefined); if ($msg && $msg.length) { $msg.addClass('d-none').text(''); } return; }
          // Call API to check if user exists (POST to keep email out of URLs/logs)
          fetch('./api/check_user_exists.php', {
            method: 'POST',
            credentials: 'same-origin',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8' },
            body: new URLSearchParams({ email: email })
          }).then(r => r.json())
            .then(json => {
              if (json && json.exists) {
                $el.data('exists', true);
                if ($msg && $msg.length) { $msg.addClass('d-none').text(''); }
                console.debug('check_user_exists: exists=true for', email);
              } else {
                
                $el.data('exists', false);
                
                if (!($msg && $msg.length)) {
                  console.debug('check_user_exists: no form-local #validate-msg found, falling back to global');
                  $msg = $('#validate-msg');
                }
                if ($msg && $msg.length) { $msg.removeClass('d-none').show().text('No account found with that email address.'); }
                console.debug('check_user_exists: exists=false for', email);
              }
            }).catch(err => {
              
              console.warn('check_user_exists failed', err);
              $el.data('exists', undefined);
            });
        });

        // Remote check for signup email to prevent duplicate registrations
        $(document).on('blur', '#signupEmail', function () {
          const $el = $(this);
          const email = $el.val().trim();
          const $form = $el.closest('form');
          const $msg = $form.find('#validate-msg');
          if (!email) { $el.data('exists', undefined); if ($msg && $msg.length) { $msg.addClass('d-none').text(''); } return; }
          
          fetch('./api/check_user_exists.php', {
            method: 'POST',
            credentials: 'same-origin',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8' },
            body: new URLSearchParams({ email: email })
          }).then(r => r.json())
            .then(json => {
              if (json && json.exists) {
                $el.data('exists', true);
                // If account is archived, show a not-allowed message; otherwise show exists message
                const archived = json.is_archived ? true : false;
                if (!($msg && $msg.length)) { $msg = $('#validate-msg'); }
                if (archived) {
                  if ($msg && $msg.length) { $msg.removeClass('d-none').show().text('This email belongs to an archived account — creating a new account with the same email is not allowed.'); }
                  $el.data('archived', true);
                } else {
                  if ($msg && $msg.length) { $msg.removeClass('d-none').show().text('An account already exists with that email address.'); }
                  $el.data('archived', false);
                }
                console.debug('check_user_exists (signup): exists=true for', email, 'archived=', archived);
              } else {
                $el.data('exists', false);
                $el.data('archived', false);
                if ($msg && $msg.length) { $msg.addClass('d-none').text(''); }
                console.debug('check_user_exists (signup): exists=false for', email);
              }
            }).catch(err => {
              console.warn('check_user_exists (signup) failed', err);
              $el.data('exists', undefined);
              $el.data('archived', undefined);
            });
        });

        // Setup login form validation rules and messages
        $("#loginForm").validate({
          rules: {
            email: {
              required: true,
              email: true,
              emailChars: true,
              emailFormat: true,
            },
            password: {
              required: true,
            },
          },
          messages: {
            email: {
              required: "Please enter your email address",
              email: "Please enter a valid email address",
              emailChars:
                "Email can only contain letters, numbers, underscores, periods, and @ symbol",
              emailFormat: "Email must have a valid format with @ and domain",
            },
            password: {
              required: "Please enter your password",
            },
          },
          submitHandler: function (form) {
            
            const submitBtn = $("#loginSubmit");
            const originalText = submitBtn.text();
            submitBtn.prop('disabled', true).text('Logging in...');
            
            // Hide any previous error messages in this form
            const $form = $(form);
            const $msg = $form.find('#validate-msg');
            if ($msg && $msg.length) { $msg.addClass('d-none').text(''); }

            
            const emailExists = $form.find('#loginEmail').data('exists');
            if (typeof emailExists !== 'undefined' && emailExists === false) {
             
              if (!($msg && $msg.length)) { $msg = $('#validate-msg'); }
              if ($msg && $msg.length) { $msg.removeClass('d-none').show().text('No account found with that email address.'); }
             
              submitBtn.prop('disabled', false).text(originalText);
              return false; // prevent submit
            }

            // If we don't have a cached existence result, perform a final check before submitting
            if (typeof emailExists === 'undefined') {
              const email = $form.find('#loginEmail').val().trim();
              if (email) {
                fetch('./api/check_user_exists.php', {
                  method: 'POST',
                  credentials: 'same-origin',
                  headers: { 'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8' },
                  body: new URLSearchParams({ email: email })
                }).then(r => r.json())
                  .then(json => {
                    if (json && json.exists) {
                      
                      $form.find('#loginEmail').data('exists', true);
                      form.submit();
                    } else {
                      $form.find('#loginEmail').data('exists', false);
                      // fallback if needed
                      if (!($msg && $msg.length)) { $msg = $('#validate-msg'); }
                      if ($msg && $msg.length) { $msg.removeClass('d-none').show().text('No account found with that email address.'); }
                      submitBtn.prop('disabled', false).text(originalText);
                    }
                  })
                  .catch(err => {
                    // On network error, allow submit and let server handle it
                    console.warn('check_user_exists failed on submit', err);
                    form.submit();
                  });
                return false; // we will submit (or block) after the async check
              }
            }

            // Submit the form
            form.submit();
          },
        });

        // Setup signup form validation rules and messages
        $("#signupForm").validate({
          rules: {
            name: {
              required: true,
              minlength: 2,
            },
            last: {
              required: true,
              minlength: 2,
            },
            email: {
              required: true,
              email: true,
              emailChars: true,
              emailFormat: true,
            },
            phone: {
              required: true,
              phoneFormat: true,
            },
            password: {
              required: true,
              passwordStrength: true,
            },
            password2: {
              required: true,
              equalTo: "#signupPassword",
              passwordStrength: true,
            },
          },
          messages: {
            name: {
              required: "Please enter your first name",
              minlength: jQuery.validator.format(
                "Name must be at least {0} characters long"
              ),
            },
            last: {
              required: "Please enter your last name",
              minlength: jQuery.validator.format(
                "Name must be at least {0} characters long"
              ),
            },
            email: {
              required: "Please enter your email address",
              email: "Please enter a valid email address",
              emailChars:
                "Email can only contain letters, numbers, underscores, periods, and @ symbol",
              emailFormat: "Email must have a valid format with @ and domain",
            },
            phone: {
              required: "Please enter your phone number",
              phoneFormat: "Please enter phone in format: 0000-000-0000",
            },
            password: {
              required: "Please enter a password",
              passwordStrength:
                "Password must contain at least 8-16 characters with at least one uppercase letter, one lowercase letter, one number, and one special character (!@#$%^&*;'[]/ etc.)",
            },
            password2: {
              required: "Please confirm your password",
              equalTo: "Passwords do not match",
              passwordStrength:
                "Password must contain at least 8-16 characters with at least one uppercase letter, one lowercase letter, one number, and one special character (!@#$%^&*;'[]/ etc.)",
            },
          },
          submitHandler: function (form) {
            // Show loading state
            const submitBtn = $("#signupSubmit");
            const originalText = submitBtn.text();
            submitBtn.prop('disabled', true).text('Creating Account...');
            
            // Hide any previous error messages
            $("#validate-msg").addClass('d-none').text('');
            // If we have an explicit existence check and it says the account exists, block submit
            const $form = $(form);
            const emailExists = $form.find('#signupEmail').data('exists');
            if (typeof emailExists !== 'undefined' && emailExists === true) {
              let $msg = $form.find('#validate-msg');
              if (!($msg && $msg.length)) { $msg = $('#validate-msg'); }
              if ($msg && $msg.length) { $msg.removeClass('d-none').show().text('An account already exists with that email address.'); }
              submitBtn.prop('disabled', false).text(originalText);
              return false; // prevent submit
            }

            // If we don't have a cached existence result, perform a final check before submitting
            if (typeof emailExists === 'undefined') {
              const email = $form.find('#signupEmail').val().trim();
              if (email) {
                fetch('./api/check_user_exists.php', {
                  method: 'POST',
                  credentials: 'same-origin',
                  headers: { 'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8' },
                  body: new URLSearchParams({ email: email })
                }).then(r => r.json())
                  .then(json => {
                    if (json && json.exists) {
                      $form.find('#signupEmail').data('exists', true);
                      let $msg = $form.find('#validate-msg');
                      if (!($msg && $msg.length)) { $msg = $('#validate-msg'); }
                      if ($msg && $msg.length) { $msg.removeClass('d-none').show().text('An account already exists with that email address.'); }
                      submitBtn.prop('disabled', false).text(originalText);
                    } else {
                      // proceed to submit
                      $form.find('#signupEmail').data('exists', false);
                      form.submit();
                    }
                  })
                  .catch(err => {
                    console.warn('check_user_exists (signup) failed on submit', err);
                    // On network error, allow submit and let server handle duplicate enforcement
                    form.submit();
                  });
                return false; // will submit (or block) after async check
              }
            }

            // Submit the form
            form.submit();
          },
        });

        // 1.9 - Setup contact form validation rules and messages
        $("#contactForm").validate({
          rules: {
            name: {
              required: true,
              minlength: 2,
            },
            email: {
              required: true,
              email: true,
              emailChars: true,
              emailFormat: true,
            },
            message: {
              required: true,
              minlength: 10,
              maxlength: 100,
            },
          },
          messages: {
            name: {
              required: "Please enter your name",
              minlength: jQuery.validator.format(
                "Name must be at least {0} characters long"
              ),
            },
            email: {
              required: "Please enter your email",
              email: "Please enter a valid email address",
              emailChars:
                "Email can only contain letters, numbers, underscores, periods, and @ symbol",
              emailFormat: "Email must have a valid format with @ and domain",
            },
            message: {
              required: "Please enter your message",
              minlength: jQuery.validator.format(
                "Message must be at least {0} characters long"
              ),
              maxlength: jQuery.validator.format(
                "Message must be no more than {0} characters long"
              ),
            },
          },
          submitHandler: function (form) {
              // Send contact message via AJAX to server endpoint
              var $form = $(form);
              var $validateMsg = $form.find('#validate-msg');
              $.ajax({
                url: './api/contact_submit.php',
                method: 'POST',
                data: $form.serialize(),
                dataType: 'json'
              }).done(function(resp){
                if (resp && resp.success) {
                  $validateMsg.removeClass('d-none alert-danger').addClass('alert alert-success').text('Message sent — thank you!').show();
                  form.reset();
                  // hide after a short delay
                  setTimeout(function(){ $validateMsg.addClass('d-none').hide().removeClass('alert-success').text(''); }, 3500);
                } else if (resp && resp.errors) {
                  // Show first error message
                  var first = Object.keys(resp.errors)[0];
                  $validateMsg.removeClass('d-none alert-success').addClass('alert alert-danger').text(resp.errors[first]).show();
                } else {
                  $validateMsg.removeClass('d-none alert-success').addClass('alert alert-danger').text('Unable to send message. Please try again later.').show();
                }
              }).fail(function(){
                $validateMsg.removeClass('d-none alert-success').addClass('alert alert-danger').text('Network or server error. Please try again later.').show();
              });
            },
        });

        // Setup checkout form (cart) validation rules and messages
        // Removed redundant errorClass, validClass, errorElement, errorPlacement, highlight, unhighlight options
        $("#checkoutForm").validate({
          rules: {
            firstName: { required: true, minlength: 2 },
            lastName: { required: true, minlength: 2 },
            email: {
              required: true,
              email: true,
              emailChars: true,
              emailFormat: true,
            },
            address: { required: true, minlength: 5 },
            province: { required: true },
            city: { required: true },
            barangay: { required: true },
            paymentMethod: { required: true },
          },
          messages: {
            firstName: {
              required: "Please enter your first name",
              minlength: jQuery.validator.format(
                "Name must be at least {0} characters long"
              ),
            },
            lastName: {
              required: "Please enter your last name",
              minlength: jQuery.validator.format(
                "Name must be at least {0} characters long"
              ),
            },
            email: {
              required: "Please enter your email address",
              email: "Please enter a valid email address",
              emailChars:
                "Email can only contain letters, numbers, underscores, periods, and @ symbol",
              emailFormat: "Email must have a valid format with @ and domain",
            },
            address: {
              required: "Please enter your address",
              minlength: jQuery.validator.format(
                "Address must be at least {0} characters long"
              ),
            },
            province: { required: "Please select a province" },
            city: { required: "Please select a city or municipality" },
            barangay: { required: "Please select a barangay" },
            paymentMethod: { required: "Please select a payment method" },
          },
          submitHandler: function (form) {
            // Gather cart from localStorage and submit via AJAX to the checkout API
            try {
              const cartJson = localStorage.getItem('sopopped_cart_v1') || '[]';
              const cart = JSON.parse(cartJson);
              if (!Array.isArray(cart) || cart.length === 0) {
                const $form = $(form);
                const $msg = $form.find('#validate-msg');
                $msg.removeClass('d-none').text('Your cart is empty. Add items before checkout.');
                return false;
              }

              // Ensure hidden input exists and set value
              const cartInput = form.querySelector('#cart_items_input');
              if (cartInput) cartInput.value = JSON.stringify(cart);

              // Submit form data via fetch so we can handle JSON response without navigating away
              const fd = new FormData(form);
              fetch(form.action, {
                method: 'POST',
                body: fd,
                credentials: 'same-origin'
              })
                .then((r) => r.json())
                .then((data) => {
                  if (data && data.success) {
                    // success - clear cart and redirect or show confirmation
                    const orderId = data.order_id || data.id || '';
                    alert('Order placed successfully.' + (orderId ? (' Order ID: ' + orderId) : ''));
                    try { localStorage.removeItem('sopopped_cart_v1'); } catch (e) {}
                    // Redirect to a simple confirmation page with order id
                    if (orderId) {
                      window.location.href = 'order_success.php?order_id=' + encodeURIComponent(orderId);
                    } else {
                      window.location.href = 'order_success.php';
                    }
                  } else {
                    const $form = $(form);
                    const $msg = $form.find('#validate-msg');
                    const err = (data && (data.error || (data.errors && JSON.stringify(data.errors)))) || 'Failed to place order. Please try again.';
                    $msg.removeClass('d-none').text(err);
                  }
                })
                .catch((err) => {
                  console.error('Checkout submit failed', err);
                  const $form = $(form);
                  const $msg = $form.find('#validate-msg');
                  $msg.removeClass('d-none').text('Network error while submitting order. Please try again.');
                });
            } catch (e) {
              console.error('Checkout submit error', e);
              const $form = $(form);
              const $msg = $form.find('#validate-msg');
              $msg.removeClass('d-none').text('Unexpected error preparing order.');
            }
            // Prevent default form submission since we handled it via fetch
            return false;
          },
        });

        // Handle input changes to remove success color when field is empty
        $(document).on(
          "input blur",
          "form input, form textarea, form select",
          function () {
            const $input = $(this);
            const $form = $input.closest("form");
            const validator = $form.data("validator");

            // If input is empty, remove the success color
            if ($input.val() === "") {
              $input.removeClass("is-valid");
            } else if (validator && validator.element($input) === true) {
              // If input has value and passes validation, add success color
              $input.addClass("is-valid").removeClass("is-invalid");
            }
          }
        );
      }

      // ===== DIALOG SETUP =====
      // Calculate navbar height for dialog positioning
      function dialogMaxHeightOffset() {
        const nav = document.querySelector(".navbar");
        const navHeight = nav ? nav.getBoundingClientRect().height : 0;
        
        return Math.max(120, navHeight + 40);
      }

      // Create responsive dialog options object with positioning
      function dialogOptions(width) {
        const maxH = window.innerHeight - dialogMaxHeightOffset();
        return {
          autoOpen: false,
          modal: true,
          width: Math.min(width, window.innerWidth - 40),
          height: "auto",
          maxHeight: maxH,
          draggable: true,
          resizable: true,
          classes: {
            "ui-dialog": "rounded-3", 
            "ui-widget-overlay": "custom-overlay", 
          },
          open: function () {
            // position below navbar center horizontally
            const nav = document.querySelector(".navbar");
            const topOffset = nav
              ? nav.getBoundingClientRect().height + 10
              : 10;
            $(this)
              .parent()
              .css({ top: topOffset + "px" });
          },
        };
      }

      //  Initialize login and signup dialogs with specific widths
      $("#loginDialog").dialog(dialogOptions(400));
      $("#signupDialog").dialog(dialogOptions(520));

      // 2.4 - Process potential URL params for login result (moved from inline component script)
      function processLoginUrlParams() {
        try {
          const urlParams = new URLSearchParams(window.location.search);
          const loginResult = urlParams.get('login_result');
          const loginMessage = urlParams.get('login_message');
          const $loginDialog = $('#loginDialog');
          const $form = $loginDialog.find('#loginForm');
          const $validate = $form.find('#validate-msg');
          const $success = $form.find('#success-msg');

          if (loginResult === 'success') {
            $success.removeClass('d-none').text(loginMessage || 'Login successful!');
            $loginDialog.dialog('open');
            if ($form && $form.length && $form[0].reset) $form[0].reset();
            setTimeout(function() { $loginDialog.dialog('close'); window.location.reload(); }, 2000);
            window.history.replaceState({}, document.title, window.location.pathname);
          } else if (loginResult === 'error') {
            // show error message in form-local validate-msg
            if (!($validate && $validate.length)) { $validate = $('#validate-msg'); }
            if ($validate && $validate.length) { $validate.removeClass('d-none').show().text(loginMessage || 'Login failed. Please try again.'); }
            $loginDialog.dialog('open');
            window.history.replaceState({}, document.title, window.location.pathname);
          }
        } catch (e) {
          console.warn('processLoginUrlParams error', e);
        }
      }

      // run at init in case the page was redirected
      processLoginUrlParams();

      // Process signup and logout URL params as well
      function processSignupUrlParams() {
        try {
          const urlParams = new URLSearchParams(window.location.search);
          const signupResult = urlParams.get('signup_result');
          const signupMessage = urlParams.get('signup_message');
          const $signupDialog = $('#signupDialog');
          const $form = $signupDialog.find('#signupForm');
          let $validate = $form.find('#validate-msg');
          const $success = $form.find('#success-msg');

          if (signupResult === 'success') {
            if ($success && $success.length) { $success.removeClass('d-none').text(signupMessage || 'Account created successfully! You can now log in.'); }
            $signupDialog.dialog('open');
            if ($form && $form.length && $form[0].reset) $form[0].reset();
            setTimeout(function() { $signupDialog.dialog('close'); }, 3000);
            window.history.replaceState({}, document.title, window.location.pathname);
          } else if (signupResult === 'error') {
            if (!($validate && $validate.length)) { $validate = $('#validate-msg'); }
            if ($validate && $validate.length) { $validate.removeClass('d-none').show().text(signupMessage || 'An error occurred. Please try again.'); }
            $signupDialog.dialog('open');
            window.history.replaceState({}, document.title, window.location.pathname);
          }
        } catch (e) {
          console.warn('processSignupUrlParams error', e);
        }
      }

      function processLogoutUrlParams() {
        try {
          const urlParams = new URLSearchParams(window.location.search);
          const logoutResult = urlParams.get('logout_result');
          const logoutMessage = urlParams.get('logout_message');
          if (logoutResult === 'success') {
            console.log(logoutMessage || 'Logged out successfully');
            window.history.replaceState({}, document.title, window.location.pathname);
          }
        } catch (e) {
          console.warn('processLogoutUrlParams error', e);
        }
      }

      // expose a global logout function for navbar onclick
      window.logout = function() {
        if (confirm('Are you sure you want to logout?')) {
          window.location.href = 'api/logout.php';
        }
      };

      // run additional processors
      processSignupUrlParams();
      processLogoutUrlParams();

      // Reset button state when dialog opens (moved from inline script)
      $('#loginDialog').on('dialogopen', function() {
        $('#loginSubmit').prop('disabled', false).text('Login');
      });

      // ===== UI BEHAVIORS =====
      // 3.1 - Open login dialog when navbar button is clicked (delegated)
      $(document).on(
        "click",
        '[data-bs-target="#loginModal"], #loginBtn',
        function (e) {
          e.preventDefault();
          $("#loginDialog").dialog("open");
        }
      );

      // Link from login dialog to signup dialog
      $(document).on("click", "#openSignup", function (e) {
        e.preventDefault();
        $("#loginDialog").dialog("close");
        $("#signupDialog").dialog("open");
      });

      // 3.6 - Format phone input for signup form (user experience, not validation)
      $(document).on("input", "#signupPhone", function () {
        let v = $(this).val().replace(/\D/g, ""); // remove non-digits
        if (v.length >= 8) {
          v =
            v.substring(0, 4) +
            "-" +
            v.substring(4, 7) +
            "-" +
            v.substring(7, 11);
        } else if (v.length >= 5) {
          v = v.substring(0, 4) + "-" + v.substring(4, 7);
        }
        $(this).val(v);
      });

      // Restrict email input to only allow letters, numbers, @, ., and _ on keydown
      function emailKeyFilter(e) {
        const allowed = /[A-Za-z0-9@._]/;
        const key = e.key;
        // Allow control keys (backspace, delete, arrows, etc.)
        if (e.ctrlKey || e.metaKey || e.altKey) return;
        if (key.length === 1 && !allowed.test(key)) {
          e.preventDefault();
        }
      }
    
      // Apply to all email fields: login, signup, contact forms, and checkout form
      $(document).on(
        "keydown",
        '#loginEmail, #signupEmail, #contactForm input[type="email"], #checkoutForm input[type="email"]',
        emailKeyFilter
      );
    }

    
    // Initialize dialogs if jQuery UI is available
    // If jQuery UI already loaded, init now
    if ($.ui && $.ui.dialog) setupDialogs();

    
    // Otherwise watch for script load and init
    $(document).on("jquery-ui-loaded", function () {
      setupDialogs();
    });

    
    
    // Recompute dialog sizes/positions on window resize
    $(window).on("resize", function () {
      if ($.ui && $.ui.dialog) {
        $(".ui-dialog-content").each(function () {
          const $d = $(this);
          const api = $d.dialog("instance");
          if (api) {
            const opts = dialogOptions(api.options.width || 400);
            $d.dialog("option", "maxHeight", opts.maxHeight);
            $d.dialog(
              "option",
              "width",
              Math.min(opts.width, window.innerWidth - 40)
            );
            // reposition below navbar
            const nav = document.querySelector(".navbar");
            const topOffset = nav
              ? nav.getBoundingClientRect().height + 10
              : 10;
            $d.parent().css({ top: topOffset + "px" });
          }
        });
      }
    });
  });
})(jQuery);

// Global handlers for toggling password visibility.
// These are outside the jQuery UI init so they always work even if dialogs
// are injected later or jQuery UI is loaded after this script.
(function ($) {
  // Reusable toggle function
  function togglePassword(buttonSelector, inputSelector) {
    $(document).on("click", buttonSelector, function (e) {
      e.preventDefault();
      const $btn = $(this);
      const $inp = $(inputSelector);
      if (!$inp || !$inp.length) return;

      const isPassword = $inp.attr("type") === "password";
      $inp.attr("type", isPassword ? "text" : "password");
      // Swap emoji: show closed-eyes when visible, monkey when hidden
      $btn.text(isPassword ? "🙉" : "🙈");
    });
  }

  // Bind handlers for known toggles
  togglePassword("#toggleLoginPassword", "#loginPassword");
  togglePassword("#toggleSignupPassword", "#signupPassword");
  togglePassword("#toggleSignupPassword2", "#signupPassword2");
})(jQuery);
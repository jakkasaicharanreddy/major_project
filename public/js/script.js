(() => {
  'use strict'

  // Fetch all the forms we want to apply custom Bootstrap validation styles to
  const forms = document.querySelectorAll('.needs-validation')

  // Loop over them and prevent submission
  Array.from(forms).forEach(form => {
    form.addEventListener('submit', event => {
      if (!form.checkValidity()) {
        event.preventDefault()
        event.stopPropagation()
      }

      form.classList.add('was-validated')
    }, false)
  })

  // Booking form: min dates + live price summary
  const bookingForm = document.querySelector('.booking-form')
  if (bookingForm) {
    const checkinInput = bookingForm.querySelector('#checkin')
    const checkoutInput = bookingForm.querySelector('#checkout')
    const summary = document.getElementById('booking-summary')
    const nightsEl = document.getElementById('summary-nights')
    const totalEl = document.getElementById('summary-total')
    const pricePerNight = Number(bookingForm.dataset.price)

    const toDateInputValue = date => {
      const year = date.getFullYear()
      const month = String(date.getMonth() + 1).padStart(2, '0')
      const day = String(date.getDate()).padStart(2, '0')
      return `${year}-${month}-${day}`
    }

    const today = new Date()
    today.setHours(0, 0, 0, 0)
    checkinInput.min = toDateInputValue(today)

    const updateCheckoutMin = () => {
      const minCheckout = new Date(checkinInput.value ? new Date(checkinInput.value + 'T00:00:00') : today)
      minCheckout.setDate(minCheckout.getDate() + 1)
      checkoutInput.min = toDateInputValue(minCheckout)
    }

    const updateSummary = () => {
      if (!checkinInput.value || !checkoutInput.value) {
        summary.classList.add('d-none')
        return
      }

      const checkinDate = new Date(checkinInput.value + 'T00:00:00')
      const checkoutDate = new Date(checkoutInput.value + 'T00:00:00')

      if (checkoutDate <= checkinDate) {
        summary.classList.add('d-none')
        return
      }

      const nights = Math.round((checkoutDate - checkinDate) / (1000 * 60 * 60 * 24))
      const total = nights * pricePerNight
      nightsEl.textContent = `${nights} night${nights === 1 ? '' : 's'}`
      totalEl.textContent = `Estimated total: ₹${total.toLocaleString('en-IN')}`
      summary.classList.remove('d-none')
    }

    checkinInput.addEventListener('change', () => {
      updateCheckoutMin()
      if (checkoutInput.value && checkoutInput.value < checkoutInput.min) {
        checkoutInput.value = ''
      }
      updateSummary()
    })

    checkoutInput.addEventListener('change', updateSummary)

    updateCheckoutMin()
  }
})()

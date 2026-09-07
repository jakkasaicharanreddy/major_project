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

  // Booking form: min dates + live price summary + blocked-date validation
  const bookingForm = document.querySelector('.booking-form')
  if (bookingForm) {
    const checkinInput = bookingForm.querySelector('#checkin')
    const checkoutInput = bookingForm.querySelector('#checkout')
    const summary = document.getElementById('booking-summary')
    const nightsEl = document.getElementById('summary-nights')
    const totalEl = document.getElementById('summary-total')
    const pricePerNight = Number(bookingForm.dataset.price)
    const submitBtn = bookingForm.querySelector('[data-booking-submit]')
    const errorEl = document.getElementById('booking-date-error')

    // Parse blocked date ranges passed from the backend (half-open intervals: [checkIn, checkOut))
    let blockedDates = []
    try {
      blockedDates = JSON.parse(bookingForm.dataset.blockedDates || '[]')
    } catch (e) {
      blockedDates = []
    }

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

    // Parse a blocked-date value into a local Date at midnight.
    // Handles both "YYYY-MM-DD" strings and full ISO date strings.

    const parseBlockedDate = value => {
      if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
        return new Date(value + 'T00:00:00')
      }
      const parsed = new Date(value)
      if (Number.isNaN(parsed.getTime())) return null
      parsed.setHours(0, 0, 0, 0)
      return parsed
    }

    // Half-open interval overlap check (same logic as the backend):
    // existing.checkIn < requested.checkOut AND existing.checkOut > requested.checkIn
    const overlapsBlockedRange = (checkInDate, checkOutDate) => {
      return blockedDates.some(range => {
        const blockedCheckIn = parseBlockedDate(range.checkIn)
        const blockedCheckOut = parseBlockedDate(range.checkOut)
        if (!blockedCheckIn || !blockedCheckOut) return false
        return blockedCheckIn < checkOutDate && blockedCheckOut > checkInDate
      })
    }

    const setDateError = (message) => {
      if (message) {
        errorEl.textContent = message
        errorEl.classList.remove('d-none')
        submitBtn.disabled = true
      } else {
        errorEl.textContent = ''
        errorEl.classList.add('d-none')
        submitBtn.disabled = false
      }
    }

    const updateSummary = () => {
      if (!checkinInput.value || !checkoutInput.value) {
        summary.classList.add('d-none')
        setDateError(null)
        return
      }

      const checkinDate = new Date(checkinInput.value + 'T00:00:00')
      const checkoutDate = new Date(checkoutInput.value + 'T00:00:00')

      if (checkoutDate <= checkinDate) {

        summary.classList.add('d-none')
        setDateError(null)
        return
      }

      // Check for overlap with blocked date ranges
      if (overlapsBlockedRange(checkinDate, checkoutDate)) {

        summary.classList.add('d-none')
        setDateError('The selected dates overlap an unavailable booking. Please choose different dates.')
        return
      }

      setDateError(null)

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
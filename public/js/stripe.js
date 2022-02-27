//since stripe is already script is already included in tour.pug 
const stripe = Stripe('pk_test_51KRD1MSDl6g11lboRcU5kc1psyaMWxvYwLyaK80snlU3Qe9WMGzYkFhraMMee4M7t1Ml28Wi4dzURf7d3gC9fF8Y003DugySIr')



//now book that tour
const bookTour = async tourId => {
    try { //1. get checkout session
        const session = await axios(`http://127.0.0.1:1000/api/v1/bookings/checkout-session/${tourId}`) //since axios is already included in base file

        console.log('session')


        //2. create checkout form + charge credit card
        await stripe.redirectToCheckout({
            sessionId: session.data.session.id
        })

    } catch (err) {
        console.log(err)
        showAlert('error occured')
    }


}


//when the book tour btn is clicked
const bookTourBtn = document.querySelector('#book-tour')


bookTourBtn.addEventListener('click', function (e) {
    const tourId = e.target.dataset.tourId
    bookTourBtn.textContent = 'Processing...'

    bookTour(tourId)
})
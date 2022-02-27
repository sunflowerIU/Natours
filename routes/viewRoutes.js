const express = require('express')
const router = express.Router()
const viewController = require('./../controllers/viewController')
const authController = require('./../controllers/authController')
const bookingController = require('./../controllers/bookingController')



////this is code to avoid csp for mapbox
const CSP = 'Content-Security-Policy';
const POLICY =
  "default-src 'self' trusted-cdn.com https://js.stripe.com/v3/;" +
  "base-uri 'self';block-all-mixed-content;" +
  "font-src 'self' https: data:;" +
  "frame-ancestors 'self' https://js.stripe.com/v3/;" +
  "connect-src 'self' http://127.0.0.1:1000 https: https://js.stripe.com/v3/ https://api.mapbox.com/mapbox-gl-js/v2.3.1/mapbox-gl.js https://cdnjs.cloudflare.com/ajax/libs/axios/0.24.0/axios.min.js;" +
  "img-src http://127.0.0.1:1000 'self' blob: data:;" +
  "object-src 'none';" +
  "script-src https: cdn.jsdelivr.net cdnjs.cloudflare.com api.mapbox.com https://js.stripe.com/v3/ trused-cdn.com 'self' blob: ;" +
  "script-src-attr 'none';" +
  "style-src 'self' https: 'unsafe-inline';" +
  'upgrade-insecure-requests;';



router.use((req, res, next) => {
  res.setHeader(CSP, POLICY)
  next();
});



///1. making route for our overview page
router.get('/',bookingController.createBookingCheckout,authController.isLoggedIn,viewController.getOverview)

///2. making route for single tour page
router.get('/tour/:slug',authController.isLoggedIn,viewController.getTour)

//3. login page route
router.get('/login',viewController.getLoginForm)

//4. my account route
router.get('/me',authController.protect,viewController.getMyAccount)


//5. my booking route
router.get('/my-tours',authController.protect,viewController.getMyTours)



module.exports = router
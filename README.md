# Wanderlust (Airbnb-Style Marketplace)

## Project Overview

Wanderlust is a web application built with Node.js, Express, MongoDB, and EJS that lets users browse travel listings, save favorites, leave reviews, and create booking requests. The app includes user authentication, image uploads via Cloudinary, and protected actions for listing owners.

## Key Features

- User registration and login with Passport.js
- Browse all travel listings on the homepage
- Create, edit, and delete listings (authenticated users only)
- Upload listing images to Cloudinary
- View detailed listing pages with reviews and booking options
- Add listings to a personal wishlist
- Create booking requests with check-in/check-out and guest count
- User-specific bookings and wishlist pages
- Flash messaging for success/error feedback
- Custom error handling for 404 and server issues

## Tech Stack

- Node.js
- Express 5
- MongoDB with Mongoose
- Passport.js + passport-local-mongoose
- EJS + ejs-mate
- Cloudinary image storage
- Multer for file upload handling
- Connect-flash for flash messages

## Installation

1. Clone the repository:

```bash
git clone <repo-url>
cd major_project
```

2. Install dependencies:

```bash
npm install
```

3. Create a `.env` file with these variables:

```env
ATLASDB_URL=<your-mongodb-connection-string>
CLOUD_NAME=<your-cloudinary-cloud-name>
CLOUD_API_KEY=<your-cloudinary-api-key>
CLOUD_API_SECRET=<your-cloudinary-api-secret>
```

4. Start the application:

```bash
node app.js
```

5. Open the app in your browser:

```text
http://localhost:8080
```

## Environment Variables

- `ATLASDB_URL` - MongoDB Atlas connection string
- `CLOUD_NAME` - Cloudinary cloud name
- `CLOUD_API_KEY` - Cloudinary API key
- `CLOUD_API_SECRET` - Cloudinary API secret

## Routes Summary

### Public routes

- `GET /` - Home page
- `GET /listings` - Browse listings
- `GET /listings/:id` - View listing details
- `GET /login` - Login page
- `GET /signUp` - Sign up page

### Authenticated routes

- `GET /listings/new` - Render listing creation form
- `POST /listings` - Create a new listing
- `GET /listings/:id/edit` - Edit listing form
- `PUT /listings/:id` - Update listing
- `DELETE /listings/:id` - Delete listing
- `GET /wishlist` - View current user wishlist
- `POST /wishlist/:listingId` - Add listing to wishlist
- `DELETE /wishlist/:listingId` - Remove listing from wishlist
- `GET /bookings` - View current user bookings
- `POST /bookings/:listingId` - Create a new booking request

### Review routes

- `POST /listings/:id/reviews` - Create review for a listing
- `DELETE /listings/:id/reviews/:reviewId` - Delete a review (owner only)

### User routes

- `POST /login` - Authenticate user
- `GET /logout` - Log out user

## Project Structure

- `app.js` - Application entry point and route mounting
- `cloudConfig.js` - Cloudinary upload configuration
- `controllers/` - Business logic for listings, users, reviews, wishlist
- `models/` - Mongoose schema definitions
- `routes/` - Express route definitions
- `views/` - EJS templates for pages
- `public/` - Static assets (CSS and JS)
- `utils/` - Custom utilities like error handling and async wrapper
- `midlewares.js` - Authentication and authorization middleware

## Data Models

- `User` - username, email, password hash (via passport-local-mongoose)
- `Listing` - title, description, image, price, location, country, reviews, owner
- `Review` - review text, rating, owner reference
- `Wishlist` - user reference and saved listing references
- `Booking` - listing reference, user reference, check-in/out dates, guests, total price

## Notes

- The app uses `express-session` and `connect-flash` to manage login state and flash messages.
- Images are uploaded with Multer and stored in Cloudinary.
- Listing deletion cascades cleanup for associated reviews and bookings.
- Protected routes use `midlewares.isLoggedin` and `midlewares.isOwner`.

## Future Improvements

- Add validation for booking date ranges and guest counts
- Add pagination for listing index
- Add search or filter by location/country
- Improve UI responsiveness and mobile support

---

## Contact

Created by `jaka sai charan`.

For project enhancements, document updates, or bug tracking, add entries to `FIXES_DOCUMENTATION.md`.

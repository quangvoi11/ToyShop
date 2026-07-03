# API Reference

## Base URL

| Environment | URL                                |
| ----------- | ---------------------------------- |
| Development | `http://localhost:5000/api/v1`     |
| Production  | `https://api.toyshop.com/api/v1`   |

## Authentication

All protected endpoints require a Bearer token:

```
Authorization: Bearer <access_token>
```

### Endpoints

| Method | Path                    | Auth     | Description          |
| ------ | ----------------------- | -------- | -------------------- |
| POST   | /auth/register          | No       | Register new user    |
| POST   | /auth/login             | No       | Login                |
| POST   | /auth/refresh           | No       | Refresh token        |
| POST   | /auth/logout            | Yes      | Logout               |
| GET    | /auth/me                | Yes      | Get current profile  |
| GET    | /products               | No       | List products        |
| GET    | /products/:slug         | No       | Get product detail   |
| GET    | /categories             | No       | List categories      |
| GET    | /categories/:slug       | No       | Get category detail  |
| GET    | /cart                   | Yes      | Get cart             |
| POST   | /cart/items             | Yes      | Add to cart          |
| PUT    | /cart/items/:id         | Yes      | Update cart item     |
| DELETE | /cart/items/:id         | Yes      | Remove cart item     |
| GET    | /orders                 | Yes      | List orders          |
| POST   | /orders                 | Yes      | Create order         |
| GET    | /orders/:id             | Yes      | Get order detail     |
| GET    | /wishlist               | Yes      | Get wishlist         |
| POST   | /wishlist               | Yes      | Add to wishlist      |
| DELETE | /wishlist/:productId    | Yes      | Remove from wishlist |
| GET    | /reviews/products/:id   | No       | List product reviews |
| POST   | /reviews                | Yes      | Create review        |
| GET    | /users/addresses        | Yes      | List addresses       |
| POST   | /users/addresses        | Yes      | Create address       |

## Response Format

### Success
```json
{
  "success": true,
  "data": {},
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "totalPages": 5
  }
}
```

### Error
```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    { "field": "email", "message": "Invalid email address" }
  ]
}
```

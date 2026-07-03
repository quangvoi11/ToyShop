import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import * as cartApi from '../../api/cart';

interface CartState {
  items: any[];
  loading: boolean;
}

const initialState: CartState = {
  items: [],
  loading: false,
};

export const fetchCart = createAsyncThunk('cart/fetch', async () => {
  return cartApi.getCart();
});

export const addToCartThunk = createAsyncThunk(
  'cart/add',
  async (body: { productId: string; quantity: number }) => {
    return cartApi.addToCart(body.productId, body.quantity);
  },
);

export const updateCartItemThunk = createAsyncThunk(
  'cart/update',
  async (body: { itemId: string; quantity: number }) => {
    return cartApi.updateCartItem(body.itemId, body.quantity);
  },
);

export const removeCartItemThunk = createAsyncThunk('cart/remove', async (itemId: string) => {
  return cartApi.removeCartItem(itemId);
});

const cartSlice = createSlice({
  name: 'cart',
  initialState,
  reducers: {
    clearCart(state) {
      state.items = [];
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchCart.pending, (state) => { state.loading = true; })
      .addCase(fetchCart.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload.items || [];
      })
      .addCase(fetchCart.rejected, (state) => { state.loading = false; })
      .addCase(addToCartThunk.fulfilled, (state, action) => {
        state.items = action.payload.items || [];
      })
      .addCase(updateCartItemThunk.fulfilled, (state, action) => {
        state.items = action.payload.items || [];
      })
      .addCase(removeCartItemThunk.fulfilled, (state, action) => {
        state.items = action.payload.items || [];
      });
  },
});

export const { clearCart } = cartSlice.actions;
export default cartSlice.reducer;

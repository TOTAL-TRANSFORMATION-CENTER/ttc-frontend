import { configureStore, combineReducers } from "@reduxjs/toolkit";
import { persistStore, persistReducer } from "redux-persist";
import { encryptTransform } from "redux-persist-transform-encrypt";
import createWebStorage from "redux-persist/lib/storage/createWebStorage";

// Web Storage configuration with Server-Side fallback to prevent SSR errors in Next.js
const createNoopStorage = () => {
  return {
    getItem() {
      return Promise.resolve(null);
    },
    setItem(_key: string, value: unknown) {
      return Promise.resolve(value);
    },
    removeItem() {
      return Promise.resolve();
    },
  };
};

const storage =
  typeof window !== "undefined"
    ? createWebStorage("local")
    : createNoopStorage();

// 1. Define a dummy/basic slice (e.g., auth) to make the store functional
import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface AuthState {
  token: string | null;
  user: { name: string; email: string } | null;
  isAuthenticated: boolean;
}

const initialAuthState: AuthState = {
  token: null,
  user: null,
  isAuthenticated: false,
};

const authSlice = createSlice({
  name: "auth",
  initialState: initialAuthState,
  reducers: {
    setCredentials: (
      state,
      action: PayloadAction<{ token: string; user: { name: string; email: string } }>
    ) => {
      state.token = action.payload.token;
      state.user = action.payload.user;
      state.isAuthenticated = true;
    },
    logOut: (state) => {
      state.token = null;
      state.user = null;
      state.isAuthenticated = false;
    },
  },
});

export const { setCredentials, logOut } = authSlice.actions;
export const authReducer = authSlice.reducer;

// 2. Combine Reducers
const rootReducer = combineReducers({
  auth: authReducer,
});

// 3. Configure State Encryption Transform
const encryptor = encryptTransform({
  secretKey: process.env.NEXT_PUBLIC_REDUX_PERSIST_KEY || "default-super-secret-key-change-in-prod",
  onError: (error) => {
    console.error("Redux Persist Encryption Error:", error);
  },
});

// 4. Configure Redux Persist
const persistConfig = {
  key: "root",
  storage,
  transforms: [encryptor],
  whitelist: ["auth"], // Persist only auth slice (contains sensitive tokens)
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const persistedReducer = persistReducer(persistConfig, rootReducer as any) as unknown as typeof rootReducer;

// 5. Configure Store
export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        // Ignore redux-persist action types that contain non-serializable values
        ignoredActions: ["persist/PERSIST", "persist/REHYDRATE", "persist/PAUSE", "persist/PERSIST", "persist/PURGE", "persist/REGISTER"],
      },
    }),
});

export const persistor = persistStore(store);

// 6. Typings
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

// Authentication bypassed - app uses local storage only
export function useAuth() {
  return { 
    user: { id: 'local-user', email: 'local@user.com' }, 
    isLoading: false, 
    isAuthenticated: true 
  };
}

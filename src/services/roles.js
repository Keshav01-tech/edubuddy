// Where each kind of user starts after signing in.
export const homeFor = (user) => (
  user?.role === 'superadmin' ? '/super-admin'
    : user?.role === 'teacher' ? '/classes'
      : user?.role === 'receptionist' ? '/scan-receipt'
        : user?.role === 'parent' ? '/parent'
        : '/dashboard'
);

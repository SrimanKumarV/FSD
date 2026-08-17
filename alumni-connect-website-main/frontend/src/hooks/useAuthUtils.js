export const useAuthUtils = (user) => {
  return {
    isAdmin: () => user?.role === 'admin',
    isAlumni: () => user?.role === 'alumni',
    isStudent: () => user?.role === 'student',
    isCollege: () => user?.role === 'college',
    isVerified: () => user?.isVerified,
    isApproved: () => user?.isApproved,
    canAccess: (feature) => {
      if (!user) return false;
      
      switch (feature) {
        case 'mentorship':
          return user.role === 'student' || (user.role === 'alumni' && user.isApproved);
        
        case 'post-jobs':
        case 'create-events':
        case 'create-contests':
          return user.role === 'alumni' || user.role === 'admin' || user.role === 'college';
        
        case 'moderate':
          return user.role === 'admin' || (user.role === 'alumni' && user.isApproved);
        
        case 'admin':
          return user.role === 'admin';
        
        default:
          return true;
      }
    }
  };
};

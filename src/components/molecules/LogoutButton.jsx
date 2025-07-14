import { useContext } from 'react';
import { AuthContext } from '@/App';
import { ApperIcon } from '@/components/ApperIcon';
import { Button } from '@/components/atoms/Button';

const LogoutButton = ({ className = "" }) => {
  const { logout } = useContext(AuthContext);
  
  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={logout}
      className={`flex items-center gap-2 text-red-600 hover:text-red-700 hover:bg-red-50 ${className}`}
    >
      <ApperIcon name="LogOut" size={16} />
      <span>Logout</span>
    </Button>
  );
};

export default LogoutButton;
import { useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

const ProtectedAdminRoute = ({ children }) => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  if (!user || user.role !== 'admin') {
    navigate('/login');
    return null;
  }

  return children;
};

export default ProtectedAdminRoute;

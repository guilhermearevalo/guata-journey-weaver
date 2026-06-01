import { Navigate } from 'react-router-dom';

/** Redireciona links antigos de /privacidade para a seção correspondente em /termos */
const PrivacidadeRedirect = () => (
  <Navigate to="/termos#politica-de-privacidade" replace />
);

export default PrivacidadeRedirect;

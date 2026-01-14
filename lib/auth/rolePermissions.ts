/**
 * Gestion des rôles et permissions dans l'application
 * Trois rôles : ROLE_OPJ, ROLE_SUPERVISEUR, ROLE_ADMIN
 */

export interface Permission {
  canViewAllBandits: boolean;
  canViewOwnBandits: boolean;
  canCreateBandit: boolean;
  canEditBandit: boolean;
  canDeleteBandit: boolean;
  canViewAllCaptures: boolean;
  canViewOwnCaptures: boolean;
  canCreateCapture: boolean;
  canEditCapture: boolean;
  canDeleteCapture: boolean;
  canValidateCapture: boolean;
  canViewAllInfractions: boolean;
  canCreateInfraction: boolean;
  canEditInfraction: boolean;
  canDeleteInfraction: boolean;
  canValidateInfraction: boolean;
  canViewReports: boolean;
  canManageUsers: boolean;
  canAccessSettings: boolean;
}

export const ROLE_PERMISSIONS: { [key: string]: Permission } = {
  ROLE_OPJ: {
    // Bandits : ne voir que ses propres + bandits de ses captures + bandits de captures validées
    canViewAllBandits: false,
    canViewOwnBandits: true,
    canCreateBandit: true,
    canEditBandit: true,
    canDeleteBandit: false, // ❌ Pas de suppression
    
    // Captures : voir ses propres captures
    canViewAllCaptures: false,
    canViewOwnCaptures: true,
    canCreateCapture: true,
    canEditCapture: true,
    canDeleteCapture: true,
    canValidateCapture: false, // ❌ Pas de validation
    
    // Infractions : peut voir mais pas ajouter/valider
    canViewAllInfractions: true,
    canCreateInfraction: false, // ❌ Pas d'ajout
    canEditInfraction: false,
    canDeleteInfraction: false,
    canValidateInfraction: false, // ❌ Pas de validation
    
    // Autres
    canViewReports: false,
    canManageUsers: false,
    canAccessSettings: false,
  },

  ROLE_SUPERVISEUR: {
    // Bandits : voir tous les bandits
    canViewAllBandits: true,
    canViewOwnBandits: true,
    canCreateBandit: true,
    canEditBandit: true,
    canDeleteBandit: true,
    
    // Captures : voir toutes les captures
    canViewAllCaptures: true,
    canViewOwnCaptures: true,
    canCreateCapture: true,
    canEditCapture: true,
    canDeleteCapture: true,
    canValidateCapture: true,
    
    // Infractions : gestion complète
    canViewAllInfractions: true,
    canCreateInfraction: true,
    canEditInfraction: true,
    canDeleteInfraction: true,
    canValidateInfraction: true,
    
    // Autres
    canViewReports: true,
    canManageUsers: false,
    canAccessSettings: false,
  },

  ROLE_ADMIN: {
    // Admin : accès complet
    canViewAllBandits: true,
    canViewOwnBandits: true,
    canCreateBandit: true,
    canEditBandit: true,
    canDeleteBandit: true,
    
    canViewAllCaptures: true,
    canViewOwnCaptures: true,
    canCreateCapture: true,
    canEditCapture: true,
    canDeleteCapture: true,
    canValidateCapture: true,
    
    canViewAllInfractions: true,
    canCreateInfraction: true,
    canEditInfraction: true,
    canDeleteInfraction: true,
    canValidateInfraction: true,
    
    canViewReports: true,
    canManageUsers: true,
    canAccessSettings: true,
  },
};

/**
 * Obtenir les permissions pour un rôle
 */
export const getPermissions = (role?: string): Permission => {
  if (!role) return ROLE_PERMISSIONS.ROLE_OPJ; // Par défaut OPJ
  return ROLE_PERMISSIONS[role] || ROLE_PERMISSIONS.ROLE_OPJ;
};

/**
 * Vérifier si un utilisateur a une permission spécifique
 */
export const hasPermission = (role: string | undefined, permission: keyof Permission): boolean => {
  const permissions = getPermissions(role);
  return permissions[permission] === true;
};

/**
 * Obtenir le label du rôle en français
 */
export const getRoleLabel = (role?: string): string => {
  switch (role) {
    case 'ROLE_ADMIN':
      return 'Administrateur';
    case 'ROLE_SUPERVISEUR':
      return 'Superviseur';
    case 'ROLE_OPJ':
      return 'Agent OPJ';
    default:
      return 'Utilisateur';
  }
};

/**
 * Obtenir l'icône du rôle
 */
export const getRoleIcon = (role?: string): string => {
  switch (role) {
    case 'ROLE_ADMIN':
      return 'admin-panel-settings';
    case 'ROLE_SUPERVISEUR':
      return 'supervisor-account';
    case 'ROLE_OPJ':
      return 'badge';
    default:
      return 'person';
  }
};

/**
 * Filtrer les bandits selon le rôle de l'utilisateur
 * Pour ROLE_OPJ : retourner ses propres bandits + bandits de ses captures
 */
export const filterBanditsByRole = (
  bandits: any[],
  role?: string,
  userId?: number,
  userCaptureIds?: number[]
): any[] => {
  const permissions = getPermissions(role);

  // Admin et Superviseur voient tous les bandits
  if (permissions.canViewAllBandits) {
    console.log('👤 Rôle avec accès complet:', role);
    return bandits;
  }

  // OPJ ne voit que :
  // 1. Les bandits qu'il a lui-même créés (createdBy === userId)
  // 2. Les bandits impliqués dans ses captures
  if (role === 'ROLE_OPJ' && userId) {
    console.log('🔐 Filtrage pour ROLE_OPJ');
    console.log('👤 userId:', userId);
    console.log('📌 userCaptureIds:', userCaptureIds);
    console.log('📊 Nombre de bandits avant filtrage:', bandits.length);

    const filtered = bandits.filter((bandit) => {
      const isOwner = bandit.createdBy === userId || bandit.userId === userId || bandit.user?.id === userId;
      const isInUserCapture =
        bandit.captures &&
        Array.isArray(bandit.captures) &&
        bandit.captures.some((capture: any) => userCaptureIds?.includes(capture.id));

      console.log(`🔍 Bandit ${bandit.id} (${bandit.nom}):`, {
        isOwner,
        isInUserCapture,
        createdBy: bandit.createdBy,
        userId: bandit.userId,
        captures: bandit.captures?.length || 0
      });

      return isOwner || isInUserCapture;
    });

    console.log('✅ Nombre de bandits après filtrage:', filtered.length);
    return filtered;
  }

  console.log('⚠️ Pas de filtrage appliqué');
  return [];
};

/**
 * Filtrer les captures selon le rôle de l'utilisateur
 */
export const filterCapturesByRole = (
  captures: any[],
  role?: string,
  userId?: number
): any[] => {
  const permissions = getPermissions(role);

  // Admin et Superviseur voient toutes les captures
  if (permissions.canViewAllCaptures) {
    return captures;
  }

  // OPJ ne voit que ses propres captures
  if (role === 'ROLE_OPJ' && userId) {
    return captures.filter(
      (capture) => capture.createdBy === userId || capture.userId === userId
    );
  }

  return [];
};

/**
 * Déterminer si un bandit peut être supprimé par l'utilisateur
 */
export const canDeleteBandit = (
  bandit: any,
  role?: string,
  userId?: number
): boolean => {
  const permissions = getPermissions(role);

  // Vérifier la permission générale
  if (!permissions.canDeleteBandit) {
    return false;
  }

  // OPJ ne peut pas supprimer
  if (role === 'ROLE_OPJ') {
    return false;
  }

  // Superviseur et Admin peuvent supprimer
  return true;
};

/**
 * Déterminer si une capture peut être validée par l'utilisateur
 */
export const canValidateCapture = (role?: string): boolean => {
  const permissions = getPermissions(role);
  return permissions.canValidateCapture === true;
};

/**
 * Déterminer si une infraction peut être ajoutée/validée par l'utilisateur
 */
export const canManageInfractions = (role?: string): boolean => {
  const permissions = getPermissions(role);
  return permissions.canCreateInfraction === true && permissions.canValidateInfraction === true;
};

export function getFormattedAdminRole(adminRole: string): string {
  switch (adminRole?.toLowerCase()) {
    case "superadmin":
      return "Super administrador";
    case "admin":
      return "Administrador";
    case "driver":
      return "Repartidor";
    case "assembler":
      return "Empaquetador";
    default:
      return adminRole;
  }
} 
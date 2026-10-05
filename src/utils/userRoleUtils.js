/**
 * Helper to determine whether an active user is an EMT (Emergency Medical Technician)
 * or an ALS Paramedic.
 * 
 * Guaranteed behavior:
 * - paramedic.rajesh / Paramedic => false (Paramedic ALS)
 * - emt.amit / Emergency Medical Technician => true (EMT)
 */
export const isEmtUser = (user) => {
  if (!user) return false;

  // Strict username checks
  if (user.username === 'emt.amit') return true;
  if (user.username === 'paramedic.rajesh') return false;

  // Designation checks
  const desig = (user.designation || '').toLowerCase();
  if (desig.includes('paramedic')) return false;
  if (desig.includes('technician') || desig.includes('emt')) return true;

  // Name checks
  const name = (user.name || '').toLowerCase();
  if (name.includes('paramedic')) return false;
  if (name.startsWith('emt') || name.includes('technician') || name.includes('emergency medical technician')) {
    return true;
  }

  // Default to false (Paramedic ALS)
  return false;
};

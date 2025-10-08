// Access Control Service for managing patient-doctor access permissions
// Handles access requests, grants, denials, and revocations

const API_BASE_URL = 'http://localhost:5000/api';

export interface AccessRequest {
  _id: string;
  doctorId: string;
  patientId: string;
  patientName: string;
  patientEmail: string;
  patientQRCode: string;
  doctorName: string;
  doctorSpecialty: string;
  requestedAt: string;
  status: 'pending' | 'granted' | 'denied' | 'revoked';
  respondedAt?: string;
  encryptionKeys: Array<{
    recordId: string;
    key: string;
    iv: number[];
    originalFileName: string;
    originalFileType: string;
  }>;
  seenByDoctor: boolean;
}

export interface EncryptionKey {
  recordId: string;
  key: string;
  iv: number[];
  originalFileName: string;
  originalFileType: string;
}

// ============================================
// DOCTOR API FUNCTIONS
// ============================================

/**
 * Send access request to patient after scanning QR code
 */
export async function sendAccessRequest(doctorId: string, patientQRCode: string): Promise<AccessRequest> {
  const response = await fetch(`${API_BASE_URL}/access-requests`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ doctorId, patientQRCode })
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to send access request');
  }

  return response.json();
}

/**
 * Get all pending access requests for a doctor
 */
export async function getDoctorPendingRequests(doctorId: string): Promise<AccessRequest[]> {
  const response = await fetch(`${API_BASE_URL}/access-requests/doctor/${doctorId}/pending`);

  if (!response.ok) {
    throw new Error('Failed to fetch pending requests');
  }

  return response.json();
}

/**
 * Get all patients with granted access for a doctor
 */
export async function getDoctorGrantedPatients(doctorId: string): Promise<AccessRequest[]> {
  const response = await fetch(`${API_BASE_URL}/access-requests/doctor/${doctorId}/granted`);

  if (!response.ok) {
    throw new Error('Failed to fetch granted patients');
  }

  return response.json();
}

/**
 * Get request history for a doctor (granted, denied, revoked)
 */
export async function getDoctorRequestHistory(doctorId: string): Promise<AccessRequest[]> {
  const response = await fetch(`${API_BASE_URL}/access-requests/doctor/${doctorId}/history`);

  if (!response.ok) {
    throw new Error('Failed to fetch request history');
  }

  return response.json();
}

/**
 * Get unseen count for doctor's request updates
 */
export async function getUnseenCount(doctorId: string): Promise<{ count: number }> {
  const response = await fetch(`${API_BASE_URL}/access-requests/doctor/${doctorId}/unseen-count`);

  if (!response.ok) {
    throw new Error('Failed to fetch unseen count');
  }

  return response.json();
}

/**
 * Mark a request as seen by doctor
 */
export async function markRequestAsSeen(requestId: string): Promise<AccessRequest> {
  const response = await fetch(`${API_BASE_URL}/access-requests/${requestId}/mark-seen`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' }
  });

  if (!response.ok) {
    throw new Error('Failed to mark request as seen');
  }

  return response.json();
}

// ============================================
// PATIENT API FUNCTIONS
// ============================================

/**
 * Get all pending access requests for a patient
 */
export async function getPatientPendingRequests(patientId: string): Promise<AccessRequest[]> {
  const response = await fetch(`${API_BASE_URL}/access-requests/patient/${patientId}/pending`);

  if (!response.ok) {
    throw new Error('Failed to fetch pending requests');
  }

  return response.json();
}

/**
 * Get all active (granted) permissions for a patient
 */
export async function getPatientActivePermissions(patientId: string): Promise<AccessRequest[]> {
  const response = await fetch(`${API_BASE_URL}/access-requests/patient/${patientId}/granted`);

  if (!response.ok) {
    throw new Error('Failed to fetch active permissions');
  }

  return response.json();
}

/**
 * Patient grants access to doctor
 */
export async function grantAccess(requestId: string, encryptionKeys: EncryptionKey[]): Promise<AccessRequest> {
  const response = await fetch(`${API_BASE_URL}/access-requests/${requestId}/grant`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ encryptionKeys })
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to grant access');
  }

  return response.json();
}

/**
 * Patient denies access request
 */
export async function denyAccess(requestId: string): Promise<AccessRequest> {
  const response = await fetch(`${API_BASE_URL}/access-requests/${requestId}/deny`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' }
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to deny access');
  }

  return response.json();
}

/**
 * Patient revokes previously granted access
 */
export async function revokeAccess(requestId: string): Promise<AccessRequest> {
  const response = await fetch(`${API_BASE_URL}/access-requests/${requestId}/revoke`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' }
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to revoke access');
  }

  return response.json();
}

// ============================================
// SHARED API FUNCTIONS
// ============================================

/**
 * Check if a doctor has access to a patient
 */
export async function checkAccess(doctorId: string, patientId: string): Promise<{ hasAccess: boolean; request: AccessRequest | null }> {
  const response = await fetch(`${API_BASE_URL}/access-requests/check/${doctorId}/${patientId}`);

  if (!response.ok) {
    throw new Error('Failed to check access');
  }

  return response.json();
}

/**
 * Get decryption key for a specific record (if doctor has access)
 */
export async function getDecryptionKey(doctorId: string, patientId: string, recordId: string): Promise<EncryptionKey> {
  const response = await fetch(`${API_BASE_URL}/access-requests/doctor/${doctorId}/patient/${patientId}/keys/${recordId}`);

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to fetch decryption key');
  }

  return response.json();
}

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Format date for display
 */
export function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

/**
 * Get status badge color
 */
export function getStatusColor(status: string): string {
  const colors = {
    pending: 'bg-yellow-100 text-yellow-800',
    granted: 'bg-green-100 text-green-800',
    denied: 'bg-red-100 text-red-800',
    revoked: 'bg-gray-100 text-gray-800'
  };
  return colors[status as keyof typeof colors] || colors.pending;
}

/**
 * Get status icon
 */
export function getStatusIcon(status: string): string {
  const icons = {
    pending: '⏳',
    granted: '✅',
    denied: '❌',
    revoked: '🔄'
  };
  return icons[status as keyof typeof icons] || '⏳';
}

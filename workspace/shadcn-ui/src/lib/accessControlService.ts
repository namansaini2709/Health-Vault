// Access Control Service for managing patient-doctor access permissions
// Handles access requests, grants, denials, and revocations

import apiClient from './apiService';

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
  const response = await apiClient.post('/access-requests', { doctorId, patientQRCode });
  return response.data;
}

/**
 * Get all pending access requests for a doctor
 */
export async function getDoctorPendingRequests(doctorId: string): Promise<AccessRequest[]> {
  const response = await apiClient.get(`/access-requests/doctor/${doctorId}/pending`);
  return response.data;
}

/**
 * Get all patients with granted access for a doctor
 */
export async function getDoctorGrantedPatients(doctorId: string): Promise<AccessRequest[]> {
  const response = await apiClient.get(`/access-requests/doctor/${doctorId}/granted`);
  return response.data;
}

/**
 * Get request history for a doctor (granted, denied, revoked)
 */
export async function getDoctorRequestHistory(doctorId: string): Promise<AccessRequest[]> {
  const response = await apiClient.get(`/access-requests/doctor/${doctorId}/history`);
  return response.data;
}

/**
 * Get unseen count for doctor's request updates
 */
export async function getUnseenCount(doctorId: string): Promise<{ count: number }> {
  const response = await apiClient.get(`/access-requests/doctor/${doctorId}/unseen-count`);
  return response.data;
}

/**
 * Mark a request as seen by doctor
 */
export async function markRequestAsSeen(requestId: string): Promise<AccessRequest> {
  const response = await apiClient.put(`/access-requests/${requestId}/mark-seen`);
  return response.data;
}

// ============================================
// PATIENT API FUNCTIONS
// ============================================

/**
 * Get all pending access requests for a patient
 */
export async function getPatientPendingRequests(patientId: string): Promise<AccessRequest[]> {
  const response = await apiClient.get(`/access-requests/patient/${patientId}/pending`);
  return response.data;
}

/**
 * Get all active (granted) permissions for a patient
 */
export async function getPatientActivePermissions(patientId: string): Promise<AccessRequest[]> {
  const response = await apiClient.get(`/access-requests/patient/${patientId}/granted`);
  return response.data;
}

/**
 * Patient grants access to doctor
 */
export async function grantAccess(requestId: string, encryptionKeys: EncryptionKey[]): Promise<AccessRequest> {
  const response = await apiClient.put(`/access-requests/${requestId}/grant`, { encryptionKeys });
  return response.data;
}

/**
 * Patient denies access request
 */
export async function denyAccess(requestId: string): Promise<AccessRequest> {
  const response = await apiClient.put(`/access-requests/${requestId}/deny`);
  return response.data;
}

/**
 * Patient revokes previously granted access
 */
export async function revokeAccess(requestId: string): Promise<AccessRequest> {
  const response = await apiClient.put(`/access-requests/${requestId}/revoke`);
  return response.data;
}

// ============================================
// SHARED API FUNCTIONS
// ============================================

/**
 * Check if a doctor has access to a patient
 */
export async function checkAccess(doctorId: string, patientId: string): Promise<{ hasAccess: boolean; request: AccessRequest | null }> {
  const response = await apiClient.get(`/access-requests/check/${doctorId}/${patientId}`);
  return response.data;
}

/**
 * Get decryption key for a specific record (if doctor has access)
 */
export async function getDecryptionKey(doctorId: string, patientId: string, recordId: string): Promise<EncryptionKey> {
  const response = await apiClient.get(`/access-requests/doctor/${doctorId}/patient/${patientId}/keys/${recordId}`);
  return response.data;
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
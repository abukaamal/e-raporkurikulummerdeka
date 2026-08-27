import Swal from 'sweetalert2';

/**
 * Custom Styled SweetAlert2 Utility for Kurikulum Merdeka e-Rapor
 */

export const swalSuccess = async (title: string, text?: string) => {
  return Swal.fire({
    title,
    text,
    icon: 'success',
    confirmButtonText: 'Selesai',
    confirmButtonColor: '#d97706', // amber-600
    customClass: {
      popup: 'rounded-3xl shadow-2xl border border-slate-100 font-sans',
      title: 'text-lg font-bold text-slate-800',
      htmlContainer: 'text-xs text-slate-600',
      confirmButton: 'px-5 py-2.5 rounded-xl font-bold text-xs shadow-md',
    },
  });
};

export const swalError = async (title: string, text?: string) => {
  return Swal.fire({
    title,
    text,
    icon: 'error',
    confirmButtonText: 'Tutup',
    confirmButtonColor: '#e11d48', // rose-600
    customClass: {
      popup: 'rounded-3xl shadow-2xl border border-slate-100 font-sans',
      title: 'text-lg font-bold text-slate-800',
      htmlContainer: 'text-xs text-slate-600',
      confirmButton: 'px-5 py-2.5 rounded-xl font-bold text-xs shadow-md',
    },
  });
};

export const swalWarning = async (title: string, text?: string) => {
  return Swal.fire({
    title,
    text,
    icon: 'warning',
    confirmButtonText: 'Mengerti',
    confirmButtonColor: '#d97706',
    customClass: {
      popup: 'rounded-3xl shadow-2xl border border-slate-100 font-sans',
      title: 'text-lg font-bold text-slate-800',
      htmlContainer: 'text-xs text-slate-600',
      confirmButton: 'px-5 py-2.5 rounded-xl font-bold text-xs shadow-md',
    },
  });
};

export const swalToast = (
  title: string,
  icon: 'success' | 'error' | 'warning' | 'info' = 'success',
  timer = 3000
) => {
  const Toast = Swal.mixin({
    toast: true,
    position: 'top-end',
    showConfirmButton: false,
    timer: timer,
    timerProgressBar: true,
    didOpen: (toast) => {
      toast.onmouseenter = Swal.stopTimer;
      toast.onmouseleave = Swal.resumeTimer;
    },
    customClass: {
      popup: 'rounded-2xl shadow-xl border border-slate-200 text-xs font-semibold',
    },
  });

  return Toast.fire({
    icon: icon,
    title: title,
  });
};

export interface SwalConfirmOptions {
  title: string;
  text?: string;
  confirmButtonText?: string;
  cancelButtonText?: string;
  icon?: 'warning' | 'question' | 'info' | 'error';
  isDangerous?: boolean;
}

export const swalConfirm = async ({
  title,
  text,
  confirmButtonText = 'Ya, Lanjutkan',
  cancelButtonText = 'Batal',
  icon = 'warning',
  isDangerous = false,
}: SwalConfirmOptions): Promise<boolean> => {
  const result = await Swal.fire({
    title,
    text,
    icon,
    showCancelButton: true,
    confirmButtonText,
    cancelButtonText,
    confirmButtonColor: isDangerous ? '#e11d48' : '#d97706', // rose-600 or amber-600
    cancelButtonColor: '#64748b', // slate-500
    reverseButtons: true,
    focusCancel: isDangerous,
    customClass: {
      popup: 'rounded-3xl shadow-2xl border border-slate-100 font-sans',
      title: 'text-base sm:text-lg font-bold text-slate-900',
      htmlContainer: 'text-xs sm:text-sm text-slate-600',
      confirmButton: 'px-5 py-2.5 rounded-xl font-bold text-xs shadow-md mx-1',
      cancelButton: 'px-5 py-2.5 rounded-xl font-semibold text-xs shadow-xs mx-1',
    },
  });

  return result.isConfirmed;
};

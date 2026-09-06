import { nextTick, readonly, ref } from 'vue'

// One app-wide polite live region (components/feedback/LiveAnnouncer.vue,
// mounted once in App.vue) renders this ref. Surfaces call announce() on a
// state change instead of carrying their own role="status": a region that is
// inserted into the DOM already containing its text is not reliably spoken.
const announcement = ref('')

async function announce(text: string): Promise<void> {
  if (announcement.value === text) {
    // Same string twice is "no change" to a screen reader — clear, let the
    // DOM flush, then set it again so it is spoken a second time.
    announcement.value = ''
    await nextTick()
  }
  announcement.value = text
}

export function useAnnounce() {
  return { announce, announcement: readonly(announcement) }
}

/**
 * Copy text to the clipboard, working in both secure and insecure contexts.
 *
 * `navigator.clipboard` only exists in secure contexts (https / localhost);
 * the LAN + Tailscale deployments serve plain http, so fall back to the
 * hidden-textarea + execCommand approach there. Throws if both paths fail.
 */
export async function copyText(text: string): Promise<void> {
  if (navigator.clipboard) {
    await navigator.clipboard.writeText(text)
    return
  }

  const textarea = document.createElement('textarea')
  textarea.value = text
  textarea.setAttribute('readonly', '')
  textarea.style.position = 'fixed'
  textarea.style.opacity = '0'
  document.body.appendChild(textarea)
  try {
    textarea.select()
    if (!document.execCommand('copy')) {
      throw new Error('execCommand copy failed')
    }
  } finally {
    textarea.remove()
  }
}

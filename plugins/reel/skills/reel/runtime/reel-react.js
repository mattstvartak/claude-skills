'use client'
import { createElement, forwardRef, useEffect, useRef, useCallback } from 'react'

export const ReelScene = forwardRef(function ReelScene(
  { src, runtime, drive, theme, track, poster, alt = '', width, height, progress, className, style, children, ...rest },
  ref,
) {
  const el = useRef(null)
  const setRef = useCallback(
    (node) => {
      el.current = node
      if (typeof ref === 'function') ref(node)
      else if (ref) ref.current = node
    },
    [ref],
  )

  useEffect(() => {
    const url = runtime ?? import.meta.url.replace(/[^/]*$/, 'reel.js')
    import(/* webpackIgnore: true */ /* turbopackIgnore: true */ /* @vite-ignore */ url).catch((err) =>
      console.error('reel-scene failed to load', err),
    )
  }, [runtime])

  useEffect(() => {
    if (progress !== undefined && el.current) el.current.progress = progress
  }, [progress])

  return createElement(
    'reel-scene',
    { ...rest, ref: setRef, src, drive, theme, track, className, style },
    poster ? createElement('img', { src: poster, width, height, alt }) : null,
    children,
  )
})

import React, { useEffect, useState } from 'react'
import type { BlockedSite } from '../../shared/types/blocked-site'
import type {
  GetBlockedSitesMessage,
  GetCurrentTabDomainMessage,
  AddBlockedSiteMessage,
  RemoveBlockedSiteMessage,
  GetBlockedSitesResponse,
  GetCurrentTabDomainResponse,
  AddBlockedSiteResponse,
  RemoveBlockedSiteResponse,
} from '../../shared/types/messages'

/**
 * 차단 사이트 목록 관리 컴포넌트
 *
 * - 마운트 시 GET_BLOCKED_SITES로 목록을 로드한다
 * - GET_CURRENT_TAB_DOMAIN으로 현재 탭 도메인을 입력창에 미리 채운다
 * - ADD_BLOCKED_SITE로 도메인을 추가한다
 * - REMOVE_BLOCKED_SITE로 도메인을 제거한다
 */
export default function BlockedSites() {
  const [sites, setSites] = useState<BlockedSite[]>([])
  const [inputValue, setInputValue] = useState('')
  const [addError, setAddError] = useState<string | null>(null)

  useEffect(() => {
    // 차단 사이트 목록 로드
    const msg: GetBlockedSitesMessage = { type: 'GET_BLOCKED_SITES' }
    chrome.runtime.sendMessage(msg, (response: GetBlockedSitesResponse) => {
      if (chrome.runtime.lastError) return
      if (response?.success) {
        setSites(response.data ?? [])
      }
    })

    // 현재 탭 도메인 로드하여 입력창에 미리 채우기
    const tabMsg: GetCurrentTabDomainMessage = { type: 'GET_CURRENT_TAB_DOMAIN' }
    chrome.runtime.sendMessage(tabMsg, (response: GetCurrentTabDomainResponse) => {
      if (chrome.runtime.lastError) return
      if (response?.success && response.data?.domain && !response.data.isAlreadyBlocked) {
        setInputValue(response.data.domain)
      }
    })
  }, [])

  function handleAdd() {
    setAddError(null)
    const msg: AddBlockedSiteMessage = {
      type: 'ADD_BLOCKED_SITE',
      payload: { domain: inputValue.trim() },
    }
    chrome.runtime.sendMessage(msg, (response: AddBlockedSiteResponse) => {
      if (chrome.runtime.lastError) {
        setAddError('오류가 발생했습니다.')
        return
      }
      if (response?.success && response.data) {
        setSites((prev) => [...prev, response.data!.site])
        setInputValue('')
      } else {
        const errorCode = response?.error ?? 'SERVER_ERROR'
        if (errorCode === 'DUPLICATE_DOMAIN') {
          setAddError('이미 등록된 도메인입니다.')
        } else if (errorCode === 'INVALID_DOMAIN') {
          setAddError('유효하지 않은 도메인입니다.')
        } else {
          setAddError('오류가 발생했습니다.')
        }
      }
    })
  }

  function handleRemove(siteId: number) {
    const msg: RemoveBlockedSiteMessage = {
      type: 'REMOVE_BLOCKED_SITE',
      payload: { siteId },
    }
    chrome.runtime.sendMessage(msg, (response: RemoveBlockedSiteResponse) => {
      if (chrome.runtime.lastError) return
      if (response?.success) {
        setSites((prev) => prev.filter((s) => s.id !== siteId))
      }
    })
  }

  return (
    <section>
      <h2 style={{ fontSize: '14px', marginBottom: '8px' }}>차단 사이트 관리</h2>

      <div style={{ display: 'flex', gap: '4px', marginBottom: '8px' }}>
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder="예: youtube.com"
          style={{ flex: 1, padding: '4px' }}
        />
        <button type="button" onClick={handleAdd}>
          추가
        </button>
      </div>

      {addError && (
        <p style={{ color: 'red', fontSize: '12px', marginBottom: '8px' }}>{addError}</p>
      )}

      {sites.length === 0 ? (
        <p style={{ fontSize: '12px', color: '#666' }}>차단된 사이트가 없습니다.</p>
      ) : (
        <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
          {sites.map((site) => (
            <li
              key={site.id}
              style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}
            >
              <span>{site.domain}</span>
              <button type="button" onClick={() => handleRemove(site.id)}>
                삭제
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

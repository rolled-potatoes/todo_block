import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import BlockedSites from './BlockedSites'

// chrome.runtime.sendMessage 모킹
const mockSendMessage = vi.fn()
global.chrome = {
  ...global.chrome,
  runtime: {
    ...global.chrome?.runtime,
    sendMessage: mockSendMessage,
  },
} as typeof chrome

describe('BlockedSites 컴포넌트', () => {
  beforeEach(() => {
    mockSendMessage.mockReset()
  })

  describe('초기 렌더링', () => {
    it('마운트 시 GET_BLOCKED_SITES 메시지를 전송하고 목록을 표시한다', async () => {
      mockSendMessage.mockImplementation((msg: unknown, callback: (r: unknown) => void) => {
        if ((msg as { type: string }).type === 'GET_BLOCKED_SITES') {
          callback({
            success: true,
            data: [
              { id: 1, domain: 'youtube.com', addedAt: 0 },
              { id: 2, domain: 'twitter.com', addedAt: 0 },
            ],
          })
        }
      })

      render(<BlockedSites />)

      await waitFor(() => {
        expect(screen.getByText('youtube.com')).toBeInTheDocument()
        expect(screen.getByText('twitter.com')).toBeInTheDocument()
      })
    })

    it('차단 사이트가 없으면 안내 문구를 표시한다', async () => {
      mockSendMessage.mockImplementation((msg: unknown, callback: (r: unknown) => void) => {
        if ((msg as { type: string }).type === 'GET_BLOCKED_SITES') {
          callback({ success: true, data: [] })
        }
      })

      render(<BlockedSites />)

      await waitFor(() => {
        expect(screen.getByText(/차단된 사이트가 없습니다/i)).toBeInTheDocument()
      })
    })

    it('현재 탭 도메인을 GET_CURRENT_TAB_DOMAIN으로 가져와 입력창에 미리 채운다', async () => {
      mockSendMessage.mockImplementation((msg: unknown, callback: (r: unknown) => void) => {
        const type = (msg as { type: string }).type
        if (type === 'GET_BLOCKED_SITES') {
          callback({ success: true, data: [] })
        } else if (type === 'GET_CURRENT_TAB_DOMAIN') {
          callback({ success: true, data: { domain: 'example.com', isAlreadyBlocked: false } })
        }
      })

      render(<BlockedSites />)

      await waitFor(() => {
        const input = screen.getByRole('textbox')
        expect((input as HTMLInputElement).value).toBe('example.com')
      })
    })
  })

  describe('사이트 추가', () => {
    it('도메인 입력 후 추가 버튼 클릭 시 ADD_BLOCKED_SITE 메시지를 전송한다', async () => {
      const user = userEvent.setup()

      mockSendMessage.mockImplementation((msg: unknown, callback: (r: unknown) => void) => {
        const type = (msg as { type: string }).type
        if (type === 'GET_BLOCKED_SITES') {
          callback({ success: true, data: [] })
        } else if (type === 'GET_CURRENT_TAB_DOMAIN') {
          callback({ success: true, data: { domain: null, isAlreadyBlocked: false } })
        } else if (type === 'ADD_BLOCKED_SITE') {
          callback({
            success: true,
            data: { site: { id: 1, domain: 'youtube.com', addedAt: 0 }, totalBlocked: 1 },
          })
        }
      })

      render(<BlockedSites />)
      await waitFor(() => screen.getByRole('textbox'))

      const input = screen.getByRole('textbox')
      await user.clear(input)
      await user.type(input, 'youtube.com')

      const addButton = screen.getByRole('button', { name: /추가/i })
      await user.click(addButton)

      expect(mockSendMessage).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'ADD_BLOCKED_SITE', payload: { domain: 'youtube.com' } }),
        expect.any(Function)
      )
    })

    it('추가 성공 후 목록에 새 도메인이 표시되고 입력창이 비워진다', async () => {
      const user = userEvent.setup()

      mockSendMessage.mockImplementation((msg: unknown, callback: (r: unknown) => void) => {
        const type = (msg as { type: string }).type
        if (type === 'GET_BLOCKED_SITES') {
          callback({ success: true, data: [] })
        } else if (type === 'GET_CURRENT_TAB_DOMAIN') {
          callback({ success: true, data: { domain: null, isAlreadyBlocked: false } })
        } else if (type === 'ADD_BLOCKED_SITE') {
          callback({
            success: true,
            data: { site: { id: 1, domain: 'youtube.com', addedAt: 0 }, totalBlocked: 1 },
          })
        }
      })

      render(<BlockedSites />)
      await waitFor(() => screen.getByRole('textbox'))

      const input = screen.getByRole('textbox')
      await user.clear(input)
      await user.type(input, 'youtube.com')
      await user.click(screen.getByRole('button', { name: /추가/i }))

      await waitFor(() => {
        expect(screen.getByText('youtube.com')).toBeInTheDocument()
        expect((input as HTMLInputElement).value).toBe('')
      })
    })

    it('DUPLICATE_DOMAIN 오류 시 오류 메시지를 표시한다', async () => {
      const user = userEvent.setup()

      mockSendMessage.mockImplementation((msg: unknown, callback: (r: unknown) => void) => {
        const type = (msg as { type: string }).type
        if (type === 'GET_BLOCKED_SITES') {
          callback({ success: true, data: [{ id: 1, domain: 'youtube.com', addedAt: 0 }] })
        } else if (type === 'GET_CURRENT_TAB_DOMAIN') {
          callback({ success: true, data: { domain: null, isAlreadyBlocked: false } })
        } else if (type === 'ADD_BLOCKED_SITE') {
          callback({ success: false, error: 'DUPLICATE_DOMAIN' })
        }
      })

      render(<BlockedSites />)
      await waitFor(() => screen.getByRole('textbox'))

      const input = screen.getByRole('textbox')
      await user.clear(input)
      await user.type(input, 'youtube.com')
      await user.click(screen.getByRole('button', { name: /추가/i }))

      await waitFor(() => {
        expect(screen.getByText(/이미 등록된 도메인/i)).toBeInTheDocument()
      })
    })

    it('INVALID_DOMAIN 오류 시 오류 메시지를 표시한다', async () => {
      const user = userEvent.setup()

      mockSendMessage.mockImplementation((msg: unknown, callback: (r: unknown) => void) => {
        const type = (msg as { type: string }).type
        if (type === 'GET_BLOCKED_SITES') {
          callback({ success: true, data: [] })
        } else if (type === 'GET_CURRENT_TAB_DOMAIN') {
          callback({ success: true, data: { domain: null, isAlreadyBlocked: false } })
        } else if (type === 'ADD_BLOCKED_SITE') {
          callback({ success: false, error: 'INVALID_DOMAIN' })
        }
      })

      render(<BlockedSites />)
      await waitFor(() => screen.getByRole('textbox'))

      const input = screen.getByRole('textbox')
      await user.clear(input)
      await user.type(input, 'https://youtube.com/watch')
      await user.click(screen.getByRole('button', { name: /추가/i }))

      await waitFor(() => {
        expect(screen.getByText(/유효하지 않은 도메인/i)).toBeInTheDocument()
      })
    })
  })

  describe('사이트 제거', () => {
    it('삭제 버튼 클릭 시 REMOVE_BLOCKED_SITE 메시지를 전송한다', async () => {
      const user = userEvent.setup()

      mockSendMessage.mockImplementation((msg: unknown, callback: (r: unknown) => void) => {
        const type = (msg as { type: string }).type
        if (type === 'GET_BLOCKED_SITES') {
          callback({
            success: true,
            data: [{ id: 1, domain: 'youtube.com', addedAt: 0 }],
          })
        } else if (type === 'GET_CURRENT_TAB_DOMAIN') {
          callback({ success: true, data: { domain: null, isAlreadyBlocked: false } })
        } else if (type === 'REMOVE_BLOCKED_SITE') {
          callback({
            success: true,
            data: { removedDomain: 'youtube.com', totalBlocked: 0 },
          })
        }
      })

      render(<BlockedSites />)

      await waitFor(() => {
        expect(screen.getByText('youtube.com')).toBeInTheDocument()
      })

      const deleteButton = screen.getByRole('button', { name: /삭제/i })
      await user.click(deleteButton)

      expect(mockSendMessage).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'REMOVE_BLOCKED_SITE', payload: { siteId: 1 } }),
        expect.any(Function)
      )
    })

    it('삭제 성공 후 목록에서 해당 도메인이 제거된다', async () => {
      const user = userEvent.setup()

      mockSendMessage.mockImplementation((msg: unknown, callback: (r: unknown) => void) => {
        const type = (msg as { type: string }).type
        if (type === 'GET_BLOCKED_SITES') {
          callback({
            success: true,
            data: [
              { id: 1, domain: 'youtube.com', addedAt: 0 },
              { id: 2, domain: 'twitter.com', addedAt: 0 },
            ],
          })
        } else if (type === 'GET_CURRENT_TAB_DOMAIN') {
          callback({ success: true, data: { domain: null, isAlreadyBlocked: false } })
        } else if (type === 'REMOVE_BLOCKED_SITE') {
          callback({
            success: true,
            data: { removedDomain: 'youtube.com', totalBlocked: 1 },
          })
        }
      })

      render(<BlockedSites />)

      await waitFor(() => {
        expect(screen.getByText('youtube.com')).toBeInTheDocument()
      })

      // youtube.com 항목의 삭제 버튼 클릭
      const deleteButtons = screen.getAllByRole('button', { name: /삭제/i })
      await user.click(deleteButtons[0])

      await waitFor(() => {
        expect(screen.queryByText('youtube.com')).not.toBeInTheDocument()
        expect(screen.getByText('twitter.com')).toBeInTheDocument()
      })
    })
  })
})

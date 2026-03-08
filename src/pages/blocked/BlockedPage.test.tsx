import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import BlockedPage from './BlockedPage'

// chrome.storage.local.get 동작을 원하는 activeTaskTitle 값으로 설정하는 헬퍼
function setupStorageMock(activeTaskTitle: string | null) {
  chrome.storage.local.get = vi.fn(
    (_key: string, callback: (result: Record<string, unknown>) => void) => {
      callback({ activeTaskTitle })
    }
  )
}

describe('BlockedPage 컴포넌트', () => {
  beforeEach(() => {
    // history.replaceState 모킹
    vi.spyOn(history, 'replaceState').mockImplementation(() => undefined)
  })

  // T-01: 집중 경고 메시지 항상 표시
  it('집중 경고 메시지를 항상 표시한다', async () => {
    setupStorageMock(null)
    render(<BlockedPage />)

    await waitFor(() => {
      expect(screen.getByRole('heading')).toBeInTheDocument()
    })
    // 집중 유도 문구가 heading에 포함되어야 한다
    expect(screen.getByRole('heading').textContent).toMatch(/집중/)
  })

  // T-02: 차단 해제 안내 항상 표시
  it('차단 해제 안내 문구를 항상 표시한다', async () => {
    setupStorageMock(null)
    render(<BlockedPage />)

    await waitFor(() => {
      expect(screen.getByText(/팝업/i)).toBeInTheDocument()
    })
  })

  // T-03: storage에서 할일 제목 로드 후 표시
  it('activeTaskTitle이 있으면 할일 제목을 화면에 표시한다', async () => {
    setupStorageMock('프로젝트 계획서 작성')
    render(<BlockedPage />)

    await waitFor(() => {
      expect(screen.getByText('프로젝트 계획서 작성')).toBeInTheDocument()
    })
  })

  // T-04: 할일 제목 없을 때 제목 영역 미표시
  it('activeTaskTitle이 null이면 할일 제목을 표시하지 않는다', async () => {
    setupStorageMock(null)
    render(<BlockedPage />)

    await waitFor(() => {
      // isLoaded 완료 시점 확인을 위해 heading 렌더링 대기
      expect(screen.getByRole('heading')).toBeInTheDocument()
    })
    // 할일 제목 레이블이 표시되지 않아야 한다
    expect(screen.queryByText(/현재 진행 중인 할일/)).not.toBeInTheDocument()
  })

  // T-05: history.replaceState 마운트 시 호출
  it('마운트 시 history.replaceState를 호출한다', async () => {
    setupStorageMock(null)
    render(<BlockedPage />)

    await waitFor(() => {
      expect(history.replaceState).toHaveBeenCalledWith(null, '', location.href)
    })
  })

  // T-06: 긴 할일 제목도 정상 렌더링
  it('50자 이상의 긴 할일 제목도 오류 없이 렌더링한다', async () => {
    const longTitle = '이것은 매우 긴 할일 제목으로 50자를 훨씬 넘는 테스트용 긴 문자열입니다 계속 이어집니다'
    setupStorageMock(longTitle)
    render(<BlockedPage />)

    await waitFor(() => {
      expect(screen.getByText(longTitle)).toBeInTheDocument()
    })
  })

  // T-07: 집중 아이콘 표시
  it('집중을 나타내는 시각적 아이콘 요소를 표시한다', async () => {
    setupStorageMock(null)
    render(<BlockedPage />)

    await waitFor(() => {
      // role="img"로 마크업된 아이콘 요소가 있어야 한다
      expect(screen.getByRole('img', { name: /집중/ })).toBeInTheDocument()
    })
  })
})

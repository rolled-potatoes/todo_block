import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import BlockedPage from './BlockedPage'

describe('BlockedPage 컴포넌트', () => {
  it('차단 안내 메시지를 표시한다', () => {
    render(<BlockedPage taskTitle={null} />)

    expect(screen.getByRole('heading', { name: /차단/i })).toBeInTheDocument()
  })

  it('진행 중인 할일 제목을 표시한다', () => {
    render(<BlockedPage taskTitle="프로젝트 계획서 작성" />)

    expect(screen.getByText('프로젝트 계획서 작성')).toBeInTheDocument()
  })

  it('"돌아가기" 안내 문구를 표시한다', () => {
    render(<BlockedPage taskTitle={null} />)

    expect(screen.getByText(/돌아가기/i)).toBeInTheDocument()
  })

  it('taskTitle이 없을 때도 정상 렌더링한다', () => {
    render(<BlockedPage taskTitle={null} />)

    // 기본 차단 메시지가 표시되어야 한다
    expect(screen.getByRole('heading')).toBeInTheDocument()
  })
})

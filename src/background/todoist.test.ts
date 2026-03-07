import { describe, it, expect, vi, beforeEach } from 'vitest'
import { fetchTodayTasks, validateApiToken } from './todoist'

// fetch 전역 모킹
const mockFetch = vi.fn()
global.fetch = mockFetch

describe('fetchTodayTasks', () => {
  beforeEach(() => {
    mockFetch.mockReset()
  })

  it('오늘 할일 목록을 성공적으로 조회한다', async () => {
    // v1 응답: { results: [...], next_cursor: null }
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: () =>
        Promise.resolve({
          results: [
            {
              id: '123',
              content: '프로젝트 계획서 작성',
              description: '',
              checked: false,
              due: { date: '2026-03-06', datetime: null, timezone: null, string: '오늘' },
              priority: 1,
              url: 'https://todoist.com/showTask?id=123',
            },
          ],
          next_cursor: null,
        }),
    })

    const result = await fetchTodayTasks('valid-token')

    expect(result.success).toBe(true)
    expect(result.data).toHaveLength(1)
    expect(result.data![0].id).toBe('123')
    expect(result.data![0].status).toBe('idle')
    expect(result.data![0].content).toBe('프로젝트 계획서 작성')

    // API 호출 검증: v1 엔드포인트 및 쿼리 파라미터 확인
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('api.todoist.com/api/v1/tasks/filter'),
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: 'Bearer valid-token',
        }),
      })
    )
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('query=today'),
      expect.any(Object)
    )
  })

  it('next_cursor가 있으면 다음 페이지를 추가로 조회한다', async () => {
    // 첫 번째 페이지
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: () =>
        Promise.resolve({
          results: [
            { id: '1', content: '할일1', description: '', checked: false, due: null, priority: 1, url: '' },
          ],
          next_cursor: 'cursor-abc',
        }),
    })
    // 두 번째 페이지 (next_cursor 없음)
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: () =>
        Promise.resolve({
          results: [
            { id: '2', content: '할일2', description: '', checked: false, due: null, priority: 1, url: '' },
          ],
          next_cursor: null,
        }),
    })

    const result = await fetchTodayTasks('valid-token')

    expect(result.success).toBe(true)
    expect(result.data).toHaveLength(2)
    expect(mockFetch).toHaveBeenCalledTimes(2)
    // 두 번째 호출에 cursor 파라미터가 포함되어야 함
    expect(mockFetch).toHaveBeenNthCalledWith(
      2,
      expect.stringContaining('cursor=cursor-abc'),
      expect.any(Object)
    )
  })

  it('401 응답 시 INVALID_TOKEN 오류를 반환한다', async () => {
    mockFetch.mockResolvedValueOnce({ ok: false, status: 401 })

    const result = await fetchTodayTasks('invalid-token')

    expect(result.success).toBe(false)
    expect(result.error).toBe('INVALID_TOKEN')
  })

  it('429 응답 시 RATE_LIMIT 오류를 반환한다', async () => {
    mockFetch.mockResolvedValueOnce({ ok: false, status: 429 })

    const result = await fetchTodayTasks('valid-token')

    expect(result.success).toBe(false)
    expect(result.error).toBe('RATE_LIMIT')
  })

  it('5xx 응답 시 SERVER_ERROR 오류를 반환한다', async () => {
    mockFetch.mockResolvedValueOnce({ ok: false, status: 500 })

    const result = await fetchTodayTasks('valid-token')

    expect(result.success).toBe(false)
    expect(result.error).toBe('SERVER_ERROR')
  })

  it('네트워크 오류 시 NETWORK_ERROR를 반환한다', async () => {
    mockFetch.mockRejectedValueOnce(new TypeError('Failed to fetch'))

    const result = await fetchTodayTasks('valid-token')

    expect(result.success).toBe(false)
    expect(result.error).toBe('NETWORK_ERROR')
  })

  it('결과가 없으면 빈 TodoItem[]를 반환한다', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: () => Promise.resolve({ results: [], next_cursor: null }),
    })

    const result = await fetchTodayTasks('valid-token')

    expect(result.success).toBe(true)
    expect(result.data).toHaveLength(0)
  })
})

describe('validateApiToken', () => {
  beforeEach(() => {
    mockFetch.mockReset()
  })

  it('유효한 토큰은 성공을 반환한다', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: () => Promise.resolve({ results: [], next_cursor: null }),
    })

    const result = await validateApiToken('valid-token')
    expect(result.success).toBe(true)
  })

  it('유효하지 않은 토큰은 INVALID_TOKEN을 반환한다', async () => {
    mockFetch.mockResolvedValueOnce({ ok: false, status: 401 })

    const result = await validateApiToken('bad-token')
    expect(result.success).toBe(false)
    expect(result.error).toBe('INVALID_TOKEN')
  })
})

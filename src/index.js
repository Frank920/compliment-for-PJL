import { Hono } from 'hono'

const app = new Hono()

// 获取已经发布的页面
app.get('/api/pages', async (c) => {
  try {
    const result = await c.env.DB.prepare(`
      SELECT
        id,
        title,
        content,
        image_url,
        sort_order,
        publish_at
      FROM pages
      WHERE published = 1
        AND (
          publish_at IS NULL
          OR publish_at <= datetime('now')
        )
      ORDER BY sort_order ASC, id ASC
    `).all()

    return c.json({
      success: true,
      pages: result.results
    })
  } catch (error) {
    return c.json({
      success: false,
      error: error.message
    }, 500)
  }
})

// 获取网站状态
app.get('/api/health', (c) => {
  return c.json({
    success: true,
    message: 'compliment for PJL API is running'
  })
})

export default app

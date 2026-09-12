import { Hono } from 'hono'

const app = new Hono()

// ================================
// 管理员登录
// ================================

app.post('/api/login', async (c) => {

  const { password } = await c.req.json()

  if (!password) {
    return c.json({
      success: false,
      error: '请输入密码'
    }, 400)
  }

  if (password !== c.env.ADMIN_PASSWORD) {
    return c.json({
      success: false,
      error: '密码错误'
    }, 401)
  }

  return c.json({
    success: true
  })
})


// ================================
// 获取公开页面
// ================================

app.get('/api/pages', async (c) => {

  try {

    const result = await c.env.DB.prepare(`
      SELECT
        id,
        title,
        content,
        image_url,
        sort_order,
        status,
        publish_at
      FROM pages
      WHERE status = 'published'
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


// ================================
// 获取后台所有页面
// ================================

app.post('/api/admin/pages', async (c) => {

  const { password } = await c.req.json()

  if (password !== c.env.ADMIN_PASSWORD) {
    return c.json({
      success: false,
      error: '密码错误'
    }, 401)
  }

  try {

    const result = await c.env.DB.prepare(`
      SELECT *
      FROM pages
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


// ================================
// 新增页面
// ================================

app.post('/api/admin/page/create', async (c) => {

  const data = await c.req.json()

  if (data.password !== c.env.ADMIN_PASSWORD) {
    return c.json({
      success: false,
      error: '密码错误'
    }, 401)
  }

  if (!data.title || !data.content) {
    return c.json({
      success: false,
      error: '标题和内容不能为空'
    }, 400)
  }

  try {

    const maxOrder = await c.env.DB.prepare(`
      SELECT MAX(sort_order) AS max_order
      FROM pages
    `).first()

    const sortOrder = (maxOrder?.max_order || 0) + 1

    const result = await c.env.DB.prepare(`
      INSERT INTO pages
      (
        title,
        content,
        image_url,
        sort_order,
        status
      )
      VALUES (?, ?, ?, ?, ?)
    `)
    .bind(
      data.title,
      data.content,
      data.image_url || null,
      sortOrder,
      data.status || 'draft'
    )
    .run()

    return c.json({
      success: true,
      id: result.meta.last_row_id
    })

  } catch (error) {

    return c.json({
      success: false,
      error: error.message
    }, 500)

  }

})


// ================================
// 修改页面
// ================================

app.put('/api/admin/page/:id', async (c) => {

  const id = c.req.param('id')
  const data = await c.req.json()

  if (data.password !== c.env.ADMIN_PASSWORD) {
    return c.json({
      success: false,
      error: '密码错误'
    }, 401)
  }

  try {

    await c.env.DB.prepare(`
      UPDATE pages
      SET
        title = ?,
        content = ?,
        image_url = ?,
        status = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `)
    .bind(
      data.title,
      data.content,
      data.image_url || null,
      data.status || 'draft',
      id
    )
    .run()

    return c.json({
      success: true
    })

  } catch (error) {

    return c.json({
      success: false,
      error: error.message
    }, 500)

  }

})


// ================================
// 删除页面
// ================================

app.delete('/api/admin/page/:id', async (c) => {

  const id = c.req.param('id')

  const data = await c.req.json()

  if (data.password !== c.env.ADMIN_PASSWORD) {
    return c.json({
      success: false,
      error: '密码错误'
    }, 401)
  }

  try {

    await c.env.DB.prepare(`
      DELETE FROM pages
      WHERE id = ?
    `)
    .bind(id)
    .run()

    return c.json({
      success: true
    })

  } catch (error) {

    return c.json({
      success: false,
      error: error.message
    }, 500)

  }

})


// ================================
// API 状态
// ================================

app.get('/api/health', (c) => {

  return c.json({
    success: true,
    message: 'compliment for PJL API is running'
  })

})


export default app

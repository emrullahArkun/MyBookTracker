import { http, HttpResponse } from 'msw';

export const handlers = [
    // Mock GET /api/books
    http.get('/api/books', () => {
        return HttpResponse.json({
            content: [
                {
                    id: 1,
                    title: 'Test Book 1',
                    authorName: 'Author 1',
                    coverUrl: 'http://example.com/cover1.jpg',
                    completed: false,
                    currentPage: 0,
                    pageCount: 300,
                    isbn: '111',
                    user: { id: 1 }
                },
                {
                    id: 2,
                    title: 'Test Book 2',
                    authorName: 'Author 2',
                    coverUrl: 'http://example.com/cover2.jpg',
                    completed: true,
                    currentPage: 300,
                    pageCount: 300,
                    isbn: '222',
                    user: { id: 1 }
                }
            ],
            totalPages: 1,
            totalElements: 2,
            size: 10,
            number: 0
        });
    }),

    // Mock PATCH /api/books/:id/status
    http.patch('/api/books/:id/status', async ({ params, request }) => {
        const { id } = params;
        const { completed } = await request.json();

        return HttpResponse.json({
            id: Number(id),
            title: 'Test Book ' + id,
            authorName: 'Author ' + id,
            completed: completed,
            coverUrl: 'http://example.com/cover.jpg',
            currentPage: 0,
            pageCount: 300,
            isbn: '123'
        });
    }),

    // Mock PATCH /api/books/:id/progress
    http.patch('/api/books/:id/progress', async ({ params, request }) => {
        const { id } = params;
        const { currentPage } = await request.json();
        return HttpResponse.json({
            id: Number(id),
            title: 'Test Book ' + id,
            authorName: 'Author ' + id,
            completed: false,
            coverUrl: 'http://example.com/cover.jpg',
            currentPage: currentPage,
            pageCount: 300
        });
    }),

    // Mock GET /api/sessions/active
    http.get('/api/sessions/active', () => {
        return new HttpResponse(null, { status: 204 });
    }),

    // Mock DELETE /api/books/:id
    http.delete('/api/books/:id', () => {
        return new HttpResponse(null, { status: 204 });
    }),

    // Mock DELETE /api/books
    http.delete('/api/books', () => {
        return new HttpResponse(null, { status: 204 });
    }),

    // Mock POST /api/sessions/active/pause
    http.post('/api/sessions/active/pause', () => {
        return HttpResponse.json({
            status: 'PAUSED',
            pausedAt: new Date().toISOString(),
            pausedMillis: 0,
            startTime: new Date().toISOString()
        });
    }),

    // Mock POST /api/sessions/active/resume
    http.post('/api/sessions/active/resume', () => {
        return HttpResponse.json({
            status: 'ACTIVE',
            pausedAt: null,
            pausedMillis: 1000,
            startTime: new Date().toISOString()
        });
    })
];

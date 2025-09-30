// SST 2.0 Opportunities Database Page

(function() {
    document.addEventListener('DOMContentLoaded', () => {
        checkAuthentication().then(isAuthed => {
            if (!isAuthed) {
                document.getElementById('loginRequired').classList.remove('d-none');
                return;
            }
            document.getElementById('databaseContent').classList.remove('d-none');
            initTable();
        });
    });

    async function checkAuthentication() {
        const authCheck = document.getElementById('authCheck');
        authCheck.classList.remove('d-none');
        try {
            const user = JSON.parse(localStorage.getItem('sst_user_data') || '{}');
            const token = localStorage.getItem('sst_session_token');
            const isVerified = user && user.emailVerified === true;
            const ok = Boolean(user && user.email && token && isVerified);
            return ok;
        } finally {
            authCheck.classList.add('d-none');
        }
    }

    function initTable() {
        const tableEl = document.getElementById('opportunitiesTable');
        const interestedKey = 'sst_interested_opportunities';
        const interestedSet = new Set(JSON.parse(localStorage.getItem(interestedKey) || '[]'));

        const dt = new DataTable(tableEl, {
            serverSide: true,
            processing: true,
            responsive: true,
            fixedHeader: true,
            pageLength: 25,
            lengthMenu: [25, 50, 100, 1000],
            order: [[8, 'desc']], // default order by Posted desc
            ajax: async (request, callback) => {
                try {
                    const params = buildQuery(request);
                    const res = await fetch(`${window.location.origin}/api/opportunities?${params}`);
                    const json = await res.json();
                    const data = (json.data || []).map(row => toRow(row, interestedSet));
                    callback({
                        data,
                        recordsTotal: json.recordsTotal || 0,
                        recordsFiltered: json.recordsFiltered || 0
                    });
                } catch (e) {
                    console.error('Failed to load opportunities', e);
                    callback({ data: [], recordsTotal: 0, recordsFiltered: 0 });
                }
            },
            columns: [
                { data: 'interested', orderable: false, searchable: false },
                { data: 'notice_id' },
                { data: 'title' },
                { data: 'agency' },
                { data: 'department' },
                { data: 'naics' },
                { data: 'psc' },
                { data: 'type' },
                { data: 'posted' },
                { data: 'response_due' },
                { data: 'set_aside' }
            ],
            createdRow: (row, data) => {
                // Attach handler for interested checkbox
                const checkbox = row.querySelector('input[type="checkbox"][data-notice-id]');
                if (checkbox) {
                    checkbox.addEventListener('change', (e) => {
                        const id = e.target.getAttribute('data-notice-id');
                        if (e.target.checked) {
                            interestedSet.add(id);
                        } else {
                            interestedSet.delete(id);
                        }
                        localStorage.setItem(interestedKey, JSON.stringify(Array.from(interestedSet)));
                    });
                }
            }
        });

        // Column toggle menu
        buildColumnToggle(dt);

        // Reset filters
        document.getElementById('resetFilters').addEventListener('click', () => {
            dt.search('').order([[8, 'desc']]).page.len(25).draw();
            // show all columns
            dt.columns().every(function(idx) { this.visible(true); });
            buildColumnToggle(dt);
        });
    }

    function buildQuery(request) {
        const params = new URLSearchParams();
        params.set('start', request.start || 0);
        params.set('length', request.length || 25);
        if (request.search && request.search.value) {
            params.set('search', request.search.value);
        }
        if (Array.isArray(request.order) && request.order.length > 0) {
            const order = request.order[0];
            params.set('order_col', order.column);
            params.set('order_dir', order.dir);
        }
        return params.toString();
    }

    function toRow(row, interestedSet) {
        const noticeId = row.notice_id || row.noticeId || '';
        const interested = `<input type="checkbox" class="form-check-input" data-notice-id="${escapeHtml(noticeId)}" ${interestedSet.has(noticeId) ? 'checked' : ''} />`;
        return {
            interested,
            notice_id: escapeHtml(noticeId),
            title: escapeHtml(row.title || ''),
            agency: escapeHtml(row.agency || ''),
            department: escapeHtml(row.department || ''),
            naics: escapeHtml(row.naics || row.naics_code || ''),
            psc: escapeHtml(row.psc || row.psc_code || ''),
            type: escapeHtml(row.type || row.notice_type || ''),
            posted: escapeHtml(row.posted || row.posted_date || ''),
            response_due: escapeHtml(row.response_due || row.response_due_date || ''),
            set_aside: escapeHtml(row.set_aside || row.setaside || '')
        };
    }

    function buildColumnToggle(dt) {
        const menu = document.getElementById('columnToggleMenu');
        menu.innerHTML = '';
        const headers = Array.from(document.querySelectorAll('#opportunitiesTable thead th'));
        headers.forEach((th, idx) => {
            const id = `col-toggle-${idx}`;
            const visible = dt.column(idx).visible();
            const item = document.createElement('div');
            item.className = 'form-check';
            item.innerHTML = `
                <input class="form-check-input" type="checkbox" id="${id}" ${visible ? 'checked' : ''} data-col="${idx}">
                <label class="form-check-label" for="${id}">${th.textContent}</label>
            `;
            item.querySelector('input').addEventListener('change', (e) => {
                const colIdx = parseInt(e.target.getAttribute('data-col'), 10);
                dt.column(colIdx).visible(e.target.checked);
            });
            menu.appendChild(item);
        });
    }

    function escapeHtml(str) {
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }
})();

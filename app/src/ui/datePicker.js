// يُسجَّل مستمعا الإغلاق (نقرة خارج المنتقي وEscape) مرة واحدة عند تحميل الوحدة، كما كانا
// في StaffSystem.jsx. المنتقي DOM خالص خارج React، ويكتب القيمة بضابط المتصفح الأصلي.
// ----------------------------------------------------
// منتقي التاريخ المخصص المتطور (Custom DatePicker)
// ----------------------------------------------------
function triggerReactInputChange(element, value) {
  try {
    const valueSetter = Object.getOwnPropertyDescriptor(element, 'value')?.set;
    const prototype = Object.getPrototypeOf(element);
    const prototypeValueSetter = Object.getOwnPropertyDescriptor(prototype, 'value')?.set;

    if (prototypeValueSetter && valueSetter !== prototypeValueSetter) {
      prototypeValueSetter.call(element, value);
    } else if (valueSetter) {
      valueSetter.call(element, value);
    } else {
      element.value = value;
    }
  } catch(e) {
    element.value = value;
  }
  element.dispatchEvent(new Event('input', { bubbles: true }));
  element.dispatchEvent(new Event('change', { bubbles: true }));
}

export function buildDatePicker(inputId) {
  const inp = document.getElementById(inputId);
  if (!inp || inp.dataset.pickerBuilt) return;
  inp.dataset.pickerBuilt = '1';

  inp.type = 'text';
  // النص يدعو للاختيار لا للكتابة — المنتقي هو الطريق الأساسي، والكتابة تبقى متاحة.
  // قصير عمداً (62px): حقل «تاريخ التجهيز الجماعي» في تبويب السلامة عرضه 128px فقط،
  // والنص الأطول كان يُقصّ فيه — مقيس فعلياً لا مُقدَّر.
  inp.placeholder = 'اختر التاريخ';
  inp.title = 'اضغط لاختيار التاريخ من التقويم (أو اكتبه بصيغة السنة-الشهر-اليوم)';
  inp.style.cursor = 'pointer';
  inp.autocomplete = 'off';
  // أيقونة تقويم ثابتة داخل الحقل (صورة خلفية لا عنصر DOM، فلا تتعارض مع إعادة رسم React،
  // وتبقى ظاهرة بعد إدخال قيمة — بخلاف النص التوضيحي الذي يختفي)
  inp.style.backgroundImage = "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='18' height='18' viewBox='0 0 24 24' fill='none' stroke='%2394a3b8' stroke-width='2' stroke-linecap='round'%3E%3Crect x='3' y='4' width='18' height='18' rx='2'/%3E%3Cpath d='M16 2v4M8 2v4M3 10h18'/%3E%3C/svg%3E\")";
  inp.style.backgroundRepeat = 'no-repeat';
  inp.style.backgroundPosition = 'left 10px center';
  inp.style.paddingLeft = '34px';

  function showPicker(e) {
    e.stopPropagation();
    closeAllPickers();

    const picker = document.createElement('div');
    picker.className = 'custom-datepicker';
    picker.dataset.inputId = inputId;

    const rect = inp.getBoundingClientRect();
    picker.style.top = (window.scrollY + rect.bottom + 4) + 'px';
    picker.style.left = (window.scrollX + rect.left) + 'px';

    let currentDate = new Date();
    if (inp.value) {
      const parts = inp.value.split('-');
      if (parts.length === 3) {
        const parsed = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
        if (!isNaN(parsed)) currentDate = parsed;
      }
    }

    let selYear = currentDate.getFullYear();
    let selMonth = currentDate.getMonth();
    let viewMode = 'days'; // 'days', 'months', 'years'

    const ms = ['كانون الثاني','شباط','آذار','نيسان','أيار','حزيران','تموز','آب','أيلول','تشرين الأول','تشرين الثاني','كانون الأول'];

    function render() {
      picker.innerHTML = '';

      const header = document.createElement('div');
      header.className = 'custom-datepicker-header';

      const nextBtn = document.createElement('div');
      nextBtn.className = 'custom-datepicker-header-btn';
      nextBtn.innerHTML = '&lsaquo;';

      const prevBtn = document.createElement('div');
      prevBtn.className = 'custom-datepicker-header-btn';
      prevBtn.innerHTML = '&rsaquo;';

      const centerTitle = document.createElement('div');
      centerTitle.style.display = 'flex';
      centerTitle.style.gap = '8px';

      if (viewMode === 'days') {
        const mBtn = document.createElement('div');
        mBtn.className = 'custom-datepicker-header-btn';
        mBtn.textContent = ms[selMonth];
        mBtn.addEventListener('click', function(ev) {
          ev.stopPropagation();
          viewMode = 'months';
          render();
        });

        const yBtn = document.createElement('div');
        yBtn.className = 'custom-datepicker-header-btn';
        yBtn.textContent = selYear;
        yBtn.addEventListener('click', function(ev) {
          ev.stopPropagation();
          viewMode = 'years';
          render();
        });

        centerTitle.append(mBtn, yBtn);

        prevBtn.addEventListener('click', function(ev) {
          ev.stopPropagation();
          selMonth--;
          if (selMonth < 0) {
            selMonth = 11;
            selYear--;
          }
          render();
        });

        nextBtn.addEventListener('click', function(ev) {
          ev.stopPropagation();
          selMonth++;
          if (selMonth > 11) {
            selMonth = 0;
            selYear++;
          }
          render();
        });

        header.append(nextBtn, centerTitle, prevBtn);
        picker.appendChild(header);

        const wdays = document.createElement('div');
        wdays.className = 'custom-datepicker-weekdays';
        const daysNames = ['سبت','أحد','اثنين','ثلاثاء','أربعاء','خميس','جمعة'];
        daysNames.forEach(d => {
          const div = document.createElement('div');
          div.textContent = d;
          wdays.appendChild(div);
        });
        picker.appendChild(wdays);

        const grid = document.createElement('div');
        grid.className = 'custom-datepicker-grid-days';

        const firstDay = new Date(selYear, selMonth, 1);
        const dayOfWeek = firstDay.getDay();
        let startIdx = (dayOfWeek + 1) % 7;

        for (let i = 0; i < startIdx; i++) {
          const cell = document.createElement('div');
          cell.className = 'custom-datepicker-item cdp-empty';
          grid.appendChild(cell);
        }

        const daysInMonth = new Date(selYear, selMonth + 1, 0).getDate();
        for (let d = 1; d <= daysInMonth; d++) {
          const cell = document.createElement('div');
          cell.className = 'custom-datepicker-item';
          cell.textContent = d;

          if (inp.value) {
            const parts = inp.value.split('-');
            if (parts.length === 3 && parseInt(parts[0]) === selYear && parseInt(parts[1]) === (selMonth + 1) && parseInt(parts[2]) === d) {
              cell.classList.add('selected');
            }
          }

          cell.addEventListener('click', function(ev) {
            ev.stopPropagation();
            const mm = String(selMonth + 1).padStart(2, '0');
            const dd = String(d).padStart(2, '0');
            // كتابة inp.value مباشرة لا تُنبّه تتبّع React الداخلي لحقل متحكَّم به (controlled)،
            // فيعود React ويمحو القيمة عند أي إعادة رسم تالية (كنبضة المزامنة كل 5 ثوانٍ) —
            // هذا بالضبط ما جعل التاريخ "يختفي بعد ثانية أو ثانيتين". الضابط الأصلي للمتصفح
            // يتجاوز هذا التتبع فيصل حدث input إلى معالج onChange في React بشكل صحيح.
            const nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
            nativeInputValueSetter.call(inp, `${selYear}-${mm}-${dd}`);
            inp.dispatchEvent(new Event('input', { bubbles: true }));
            inp.dispatchEvent(new Event('change', { bubbles: true }));
            closeAllPickers();
          });

          grid.appendChild(cell);
        }
        picker.appendChild(grid);

      } else if (viewMode === 'months') {
        const yBtn = document.createElement('div');
        yBtn.className = 'custom-datepicker-header-btn';
        yBtn.textContent = selYear;
        yBtn.addEventListener('click', function(ev) {
          ev.stopPropagation();
          viewMode = 'years';
          render();
        });

        centerTitle.appendChild(yBtn);

        prevBtn.addEventListener('click', function(ev) {
          ev.stopPropagation();
          selYear--;
          render();
        });

        nextBtn.addEventListener('click', function(ev) {
          ev.stopPropagation();
          selYear++;
          render();
        });

        header.append(nextBtn, centerTitle, prevBtn);
        picker.appendChild(header);

        const grid = document.createElement('div');
        grid.className = 'custom-datepicker-grid-months';

        ms.forEach((m, idx) => {
          const cell = document.createElement('div');
          cell.className = 'custom-datepicker-item';
          cell.textContent = m;
          if (idx === selMonth) {
            cell.classList.add('selected');
          }

          cell.addEventListener('click', function(ev) {
            ev.stopPropagation();
            selMonth = idx;
            viewMode = 'days';
            render();
          });

          grid.appendChild(cell);
        });
        picker.appendChild(grid);

      } else if (viewMode === 'years') {
        const label = document.createElement('div');
        label.className = 'custom-datepicker-header-btn';
        label.textContent = 'اختر السنة';
        centerTitle.appendChild(label);

        header.appendChild(centerTitle);
        picker.appendChild(header);

        const grid = document.createElement('div');
        grid.className = 'custom-datepicker-grid-years';

        const curY = new Date().getFullYear();
        for (let y = curY + 5; y >= 1950; y--) {
          const cell = document.createElement('div');
          cell.className = 'custom-datepicker-item';
          cell.textContent = y;
          if (y === selYear) {
            cell.classList.add('selected');
          }

          cell.addEventListener('click', function(ev) {
            ev.stopPropagation();
            selYear = y;
            viewMode = 'months';
            render();
          });

          grid.appendChild(cell);
        }
        picker.appendChild(grid);

        setTimeout(function() {
          const selectedEl = grid.querySelector('.selected');
          if (selectedEl) {
            selectedEl.scrollIntoView({ block: 'center', behavior: 'auto' });
          }
        }, 10);
      }
    }

    render();
    document.body.appendChild(picker);

    picker.addEventListener('click', function(ev) {
      ev.stopPropagation();
    });
  }

  inp.addEventListener('click', showPicker);
}

function closeAllPickers() {
  document.querySelectorAll('.custom-datepicker').forEach(el => el.remove());
}

document.addEventListener('click', function(e) {
  document.querySelectorAll('.custom-datepicker').forEach(picker => {
    const inputId = picker.dataset.inputId;
    const inp = document.getElementById(inputId);
    if (inp && !picker.contains(e.target) && e.target !== inp) {
      picker.remove();
    }
  });
}, true);

document.addEventListener('keydown', function(e) {
  if (e.key === 'Escape') {
    closeAllPickers();
  }
});

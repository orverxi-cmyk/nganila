"use client";

import React, { useEffect, useRef } from "react";
import "quill/dist/quill.snow.css";

interface RichTextEditorProps {
  value: string;
  onChange: (content: string) => void;
  label?: string;
  placeholder?: string;
}

export function RichTextEditor({ value, onChange, label, placeholder }: RichTextEditorProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const resizerBoxRef = useRef<HTMLDivElement>(null);
  const columnGuideRef = useRef<HTMLDivElement>(null);
  const selectedImgRef = useRef<HTMLImageElement | null>(null);
  const isResizingColRef = useRef(false);
  const quillRef = useRef<any>(null);
  const isUpdatingRef = useRef(false);

  const updateResizerPosition = () => {
    const img = selectedImgRef.current;
    const wrapper = wrapperRef.current;
    const resizer = resizerBoxRef.current;
    if (!img || !wrapper || !resizer) {
      if (resizer) resizer.style.display = "none";
      return;
    }
    const imgRect = img.getBoundingClientRect();
    const wrapperRect = wrapper.getBoundingClientRect();

    const top = imgRect.top - wrapperRect.top + wrapper.scrollTop;
    const left = imgRect.left - wrapperRect.left + wrapper.scrollLeft;

    resizer.style.display = "block";
    resizer.style.top = `${top}px`;
    resizer.style.left = `${left}px`;
    resizer.style.width = `${imgRect.width}px`;
    resizer.style.height = `${imgRect.height}px`;

    const label = resizer.querySelector(".img-dim-label");
    if (label) {
      label.textContent = `${Math.round(imgRect.width)} × ${Math.round(imgRect.height)}px`;
    }
  };

  const onHandleMouseDown = (e: React.MouseEvent, handle: string) => {
    e.preventDefault();
    e.stopPropagation();
    const img = selectedImgRef.current;
    if (!img) return;

    const startX = e.clientX;
    const startY = e.clientY;
    const startWidth = img.offsetWidth || img.getBoundingClientRect().width;
    const startHeight = img.offsetHeight || img.getBoundingClientRect().height;
    const aspectRatio = startWidth / (startHeight || 1);

    const onMouseMove = (moveEvent: MouseEvent) => {
      moveEvent.preventDefault();
      const dx = moveEvent.clientX - startX;
      const dy = moveEvent.clientY - startY;

      let newWidth = startWidth;
      let newHeight = startHeight;

      if (handle.includes("e")) newWidth = Math.max(40, startWidth + dx);
      if (handle.includes("w")) newWidth = Math.max(40, startWidth - dx);
      if (handle.includes("s")) newHeight = Math.max(40, startHeight + dy);
      if (handle.includes("n")) newHeight = Math.max(40, startHeight - dy);

      // Keep aspect ratio when dragging corner handles
      if (handle === "se" || handle === "nw" || handle === "ne" || handle === "sw") {
        newHeight = Math.round(newWidth / aspectRatio);
      }

      img.style.width = `${Math.round(newWidth)}px`;
      img.style.height = `${Math.round(newHeight)}px`;
      img.setAttribute("width", `${Math.round(newWidth)}`);
      img.removeAttribute("height");

      updateResizerPosition();
    };

    const onMouseUp = () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
      if (quillRef.current) {
        onChange(quillRef.current.root.innerHTML);
      }
    };

    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
  };

  const setImgPresetWidth = (pct: number | string) => {
    const img = selectedImgRef.current;
    if (!img) return;
    if (typeof pct === "number") {
      img.style.width = `${pct}%`;
      img.style.height = "auto";
      img.removeAttribute("width");
      img.removeAttribute("height");
    } else if (pct === "delete") {
      img.remove();
      selectedImgRef.current = null;
      if (resizerBoxRef.current) resizerBoxRef.current.style.display = "none";
    }
    updateResizerPosition();
    if (quillRef.current) {
      onChange(quillRef.current.root.innerHTML);
    }
  };

  useEffect(() => {
    let isMounted = true;

    if (typeof window !== "undefined" && containerRef.current && !quillRef.current) {
      const initQuill = async () => {
        const QuillModule = await import("quill");
        const Quill = QuillModule.default;

        if (!isMounted || quillRef.current) return;

        // Clean up any previously attached duplicate toolbar
        if (containerRef.current?.parentElement) {
          const prevToolbars = containerRef.current.parentElement.querySelectorAll(".ql-toolbar");
          prevToolbars.forEach((el) => el.remove());
        }

        quillRef.current = new Quill(containerRef.current!, {
          theme: "snow",
          modules: {
            toolbar: {
              container: [
                [{ font: [] }],
                [{ size: ["small", false, "large", "huge"] }],
                ["bold", "italic", "underline", "strike"],
                [{ color: [] }, { background: [] }],
                [{ align: [] }],
                [{ list: "ordered" }, { list: "bullet" }],
                [{ indent: "-1" }, { indent: "+1" }],
                [{ direction: "rtl" }],
                [{ header: [1, 2, 3, 4, 5, 6, false] }],
                [{ script: "sub" }, { script: "super" }],
                ["image", "link", "code-block"],
                ["blockquote", "table"],
                ["clean"],
              ],
              handlers: {
                table: function () {
                  const quill = quillRef.current;
                  if (!quill) return;
                  const range = quill.getSelection(true) || { index: quill.getLength() };
                  const targetIndex = quill.getSelection(true)?.index ?? range.index;
                  const tableHtml = `<table width="100%" cellpadding="6" cellspacing="0" border="1" style="border-collapse:collapse; margin:12px 0; border:1px solid #cbd5e1;"><tr><td style="padding:8px; border:1px solid #cbd5e1; width:50%;">Cell 1</td><td style="padding:8px; border:1px solid #cbd5e1; width:50%;">Cell 2</td></tr><tr><td style="padding:8px; border:1px solid #cbd5e1;">Cell 3</td><td style="padding:8px; border:1px solid #cbd5e1;">Cell 4</td></tr></table><p><br></p>`;
                  quill.clipboard.dangerouslyPasteHTML(targetIndex, tableHtml);
                },
                image: function () {
                  const quill = quillRef.current;
                  if (!quill) return;
                  // Direct file upload dialog
                  const input = document.createElement("input");
                  input.setAttribute("type", "file");
                  input.setAttribute("accept", "image/*");
                  input.click();
                  input.onchange = () => {
                    const file = input.files?.[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onload = (e) => {
                        const dataUrl = e.target?.result as string;
                        const range = quill.getSelection(true) || { index: quill.getLength() };
                        const targetIndex = quill.getSelection(true)?.index ?? range.index;
                        quill.insertEmbed(targetIndex, "image", dataUrl);
                        quill.setSelection(targetIndex + 1);
                        setTimeout(() => {
                          const images = quill.root.querySelectorAll("img");
                          const lastImg = images[images.length - 1];
                          if (lastImg) {
                            selectedImgRef.current = lastImg;
                            updateResizerPosition();
                          }
                        }, 100);
                      };
                      reader.readAsDataURL(file);
                    }
                  };
                },
              },
            },
          },
          placeholder: placeholder || "Write something...",
        });

        if (value) {
          quillRef.current.root.innerHTML = value;
        }

        quillRef.current.on("text-change", () => {
          if (!isUpdatingRef.current) {
            const html = quillRef.current.root.innerHTML;
            if (html === "<p><br></p>" && !value) return;
            onChange(html);
          }
        });

        const root = quillRef.current.root;

        // Image Click Handler to open resize handles
        const handleImageClick = (e: MouseEvent) => {
          const target = e.target as HTMLElement;
          if (target && target.tagName === "IMG") {
            e.stopPropagation();
            selectedImgRef.current = target as HTMLImageElement;
            updateResizerPosition();
          } else {
            if (!resizerBoxRef.current?.contains(target)) {
              selectedImgRef.current = null;
              if (resizerBoxRef.current) {
                resizerBoxRef.current.style.display = "none";
              }
            }
          }
        };

        // Column Hover Handler for col-resize cursor
        const handleMouseMove = (e: MouseEvent) => {
          if (isResizingColRef.current) return;
          const target = e.target as HTMLElement;
          const cell = target.closest("td, th") as HTMLTableCellElement | null;
          if (!cell) {
            root.style.cursor = "";
            return;
          }
          const rect = cell.getBoundingClientRect();
          const nextCell = cell.nextElementSibling as HTMLTableCellElement | null;
          const isNearRightBorder = Math.abs(e.clientX - rect.right) <= 8;

          if (isNearRightBorder && nextCell) {
            cell.style.cursor = "col-resize";
          } else {
            cell.style.cursor = "";
          }
        };

        // Column Drag Handler to resize table columns
        const handleMouseDown = (e: MouseEvent) => {
          const target = e.target as HTMLElement;
          const cell = target.closest("td, th") as HTMLTableCellElement | null;
          if (!cell) return;
          const rect = cell.getBoundingClientRect();
          const nextCell = cell.nextElementSibling as HTMLTableCellElement | null;
          const isNearRightBorder = Math.abs(e.clientX - rect.right) <= 8;
          const table = cell.closest("table");

          if (isNearRightBorder && nextCell && table) {
            e.preventDefault();
            e.stopPropagation();
            isResizingColRef.current = true;

            const startX = e.clientX;
            const startLeftWidth = cell.getBoundingClientRect().width;
            const startRightWidth = nextCell.getBoundingClientRect().width;
            const tableWidth = table.getBoundingClientRect().width;

            const guide = columnGuideRef.current;
            const wrapper = wrapperRef.current;
            if (guide && wrapper) {
              const wrapperRect = wrapper.getBoundingClientRect();
              const tableRect = table.getBoundingClientRect();
              guide.style.display = "block";
              guide.style.left = `${e.clientX - wrapperRect.left + wrapper.scrollLeft}px`;
              guide.style.top = `${tableRect.top - wrapperRect.top + wrapper.scrollTop}px`;
              guide.style.height = `${tableRect.height}px`;
            }

            const onColMouseMove = (moveEvent: MouseEvent) => {
              moveEvent.preventDefault();
              const dx = moveEvent.clientX - startX;
              const newLeftPx = startLeftWidth + dx;
              const newRightPx = startRightWidth - dx;

              if (newLeftPx > 25 && newRightPx > 25) {
                const leftPct = Math.max(5, Math.min(95, Math.round((newLeftPx / tableWidth) * 100)));
                const rightPct = Math.max(5, Math.min(95, Math.round((newRightPx / tableWidth) * 100)));

                cell.style.width = `${leftPct}%`;
                cell.setAttribute("width", `${leftPct}%`);
                nextCell.style.width = `${rightPct}%`;
                nextCell.setAttribute("width", `${rightPct}%`);

                if (guide && wrapper) {
                  const wrapperRect = wrapper.getBoundingClientRect();
                  guide.style.left = `${moveEvent.clientX - wrapperRect.left + wrapper.scrollLeft}px`;
                }
              }
            };

            const onColMouseUp = () => {
              isResizingColRef.current = false;
              window.removeEventListener("mousemove", onColMouseMove);
              window.removeEventListener("mouseup", onColMouseUp);
              if (guide) guide.style.display = "none";
              if (quillRef.current) {
                onChange(quillRef.current.root.innerHTML);
              }
            };

            window.addEventListener("mousemove", onColMouseMove);
            window.addEventListener("mouseup", onColMouseUp);
          }
        };

        root.addEventListener("click", handleImageClick);
        root.addEventListener("mousemove", handleMouseMove);
        root.addEventListener("mousedown", handleMouseDown);
      };

      initQuill();
    }

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (quillRef.current && value !== quillRef.current.root.innerHTML) {
      isUpdatingRef.current = true;
      quillRef.current.root.innerHTML = value || "";
      isUpdatingRef.current = false;
    }
  }, [value]);

  useEffect(() => {
    const onScrollOrResize = () => {
      if (selectedImgRef.current) {
        updateResizerPosition();
      }
    };
    window.addEventListener("scroll", onScrollOrResize, true);
    window.addEventListener("resize", onScrollOrResize);
    return () => {
      window.removeEventListener("scroll", onScrollOrResize, true);
      window.removeEventListener("resize", onScrollOrResize);
    };
  }, []);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        selectedImgRef.current = null;
        if (resizerBoxRef.current) {
          resizerBoxRef.current.style.display = "none";
        }
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
    };
  }, []);

  return (
    <div className="space-y-1.5">
      {label && <label className="text-[10px] font-bold uppercase text-muted-foreground">{label}</label>}
      <div ref={wrapperRef} className="relative rounded-md border bg-white shadow-sm rich-text-editor-container">
        <div ref={containerRef} className="min-h-[150px]" />

        {/* Drag Resizer Overlay for Selected Image */}
        <div
          ref={resizerBoxRef}
          style={{ display: "none" }}
          className="absolute border-2 border-[#8DB833] pointer-events-none z-40 image-resizer-box"
        >
          {/* Corner & Edge Drag Handles */}
          <div onMouseDown={(e) => onHandleMouseDown(e, "nw")} className="resizer-handle nw" />
          <div onMouseDown={(e) => onHandleMouseDown(e, "ne")} className="resizer-handle ne" />
          <div onMouseDown={(e) => onHandleMouseDown(e, "se")} className="resizer-handle se" />
          <div onMouseDown={(e) => onHandleMouseDown(e, "sw")} className="resizer-handle sw" />
          <div onMouseDown={(e) => onHandleMouseDown(e, "n")} className="resizer-handle n" />
          <div onMouseDown={(e) => onHandleMouseDown(e, "s")} className="resizer-handle s" />
          <div onMouseDown={(e) => onHandleMouseDown(e, "w")} className="resizer-handle w" />
          <div onMouseDown={(e) => onHandleMouseDown(e, "e")} className="resizer-handle e" />

          {/* Quick Resizing Toolbar & Dimensions Badge */}
          <div className="absolute -bottom-9 left-1/2 -translate-x-1/2 flex items-center gap-1 bg-slate-900 text-white px-2 py-1 rounded-md shadow-lg pointer-events-auto text-[10px] whitespace-nowrap z-50">
            <span className="img-dim-label font-mono font-bold text-[#8DB833] mr-1.5" />
            <button
              type="button"
              onClick={() => setImgPresetWidth(25)}
              className="px-1.5 py-0.5 rounded hover:bg-slate-700 font-bold"
            >
              25%
            </button>
            <button
              type="button"
              onClick={() => setImgPresetWidth(50)}
              className="px-1.5 py-0.5 rounded hover:bg-slate-700 font-bold"
            >
              50%
            </button>
            <button
              type="button"
              onClick={() => setImgPresetWidth(75)}
              className="px-1.5 py-0.5 rounded hover:bg-slate-700 font-bold"
            >
              75%
            </button>
            <button
              type="button"
              onClick={() => setImgPresetWidth(100)}
              className="px-1.5 py-0.5 rounded hover:bg-slate-700 font-bold"
            >
              100%
            </button>
            <span className="text-slate-600">|</span>
            <button
              type="button"
              onClick={() => setImgPresetWidth("delete")}
              className="px-1.5 py-0.5 rounded hover:bg-red-700 text-red-300 font-bold"
              title="Delete Image"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Column Resizing Vertical Guide Line */}
        <div
          ref={columnGuideRef}
          style={{ display: "none" }}
          className="absolute w-0.5 bg-[#8DB833] pointer-events-none z-50 shadow-[0_0_8px_rgba(141,184,51,0.8)]"
        />
      </div>

      <style jsx global>{`
        .rich-text-editor-container .resizer-handle {
          position: absolute;
          width: 10px;
          height: 10px;
          background: #ffffff;
          border: 2px solid #8DB833;
          border-radius: 2px;
          pointer-events: auto;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
        }
        .rich-text-editor-container .resizer-handle.nw {
          top: -5px;
          left: -5px;
          cursor: nwse-resize;
        }
        .rich-text-editor-container .resizer-handle.ne {
          top: -5px;
          right: -5px;
          cursor: nesw-resize;
        }
        .rich-text-editor-container .resizer-handle.se {
          bottom: -5px;
          right: -5px;
          cursor: nwse-resize;
        }
        .rich-text-editor-container .resizer-handle.sw {
          bottom: -5px;
          left: -5px;
          cursor: nesw-resize;
        }
        .rich-text-editor-container .resizer-handle.n {
          top: -5px;
          left: calc(50% - 5px);
          cursor: ns-resize;
        }
        .rich-text-editor-container .resizer-handle.s {
          bottom: -5px;
          left: calc(50% - 5px);
          cursor: ns-resize;
        }
        .rich-text-editor-container .resizer-handle.w {
          top: calc(50% - 5px);
          left: -5px;
          cursor: ew-resize;
        }
        .rich-text-editor-container .resizer-handle.e {
          top: calc(50% - 5px);
          right: -5px;
          cursor: ew-resize;
        }

        .rich-text-editor-container .ql-editor img {
          cursor: pointer;
          transition: outline 0.15s ease;
          max-width: 100%;
        }
        .rich-text-editor-container .ql-editor img:hover {
          outline: 2px solid #8DB833;
        }
        .rich-text-editor-container .ql-editor table {
          border-collapse: collapse;
          width: 100%;
          margin: 12px 0;
        }
        .rich-text-editor-container .ql-editor table td,
        .rich-text-editor-container .ql-editor table th {
          border: 1px dashed #cbd5e1;
          padding: 8px;
          position: relative;
          min-width: 35px;
        }
        .rich-text-editor-container .ql-editor table td:hover,
        .rich-text-editor-container .ql-editor table th:hover {
          outline: 1px solid #8DB833;
        }

        .rich-text-editor-container .ql-toolbar {
          border-top: none;
          border-left: none;
          border-right: none;
          border-bottom: 1px solid hsl(var(--border));
          background: hsl(var(--muted)/0.3);
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          gap: 2px;
          padding: 6px 8px;
        }
        .rich-text-editor-container .ql-toolbar .ql-formats {
          border-right: 1px solid #cbd5e1;
          padding-right: 6px;
          margin-right: 6px;
          display: inline-flex;
          align-items: center;
        }
        .rich-text-editor-container .ql-toolbar .ql-formats:last-child {
          border-right: none;
          padding-right: 0;
          margin-right: 0;
        }
        .rich-text-editor-container button.ql-table {
          display: inline-flex;
          align-items: center;
          justify-content: center;
        }
        .rich-text-editor-container button.ql-table::before {
          content: "";
          width: 16px;
          height: 16px;
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23444' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Crect width='18' height='18' x='3' y='3' rx='2'/%3E%3Cpath d='M3 9h18'/%3E%3Cpath d='M3 15h18'/%3E%3Cpath d='M9 3v18'/%3E%3Cpath d='M15 3v18'/%3E%3C/svg%3E");
          background-size: contain;
          background-repeat: no-repeat;
        }
        .rich-text-editor-container .ql-container {
          border: none !important;
          font-family: inherit;
        }
        .rich-text-editor-container .ql-editor {
          font-size: 0.875rem;
          min-height: 180px;
        }
        .rich-text-editor-container .ql-snow .ql-picker.ql-size .ql-picker-label::before,
        .rich-text-editor-container .ql-snow .ql-picker.ql-size .ql-picker-item::before {
          content: '12pt';
        }
        .rich-text-editor-container .ql-snow .ql-picker.ql-size .ql-picker-label[data-value="small"]::before,
        .rich-text-editor-container .ql-snow .ql-picker.ql-size .ql-picker-item[data-value="small"]::before {
          content: '10pt';
        }
        .rich-text-editor-container .ql-snow .ql-picker.ql-size .ql-picker-label[data-value="large"]::before,
        .rich-text-editor-container .ql-snow .ql-picker.ql-size .ql-picker-item[data-value="large"]::before {
          content: '16pt';
        }
        .rich-text-editor-container .ql-snow .ql-picker.ql-size .ql-picker-label[data-value="huge"]::before,
        .rich-text-editor-container .ql-snow .ql-picker.ql-size .ql-picker-item[data-value="huge"]::before {
          content: '22pt';
        }
        .rich-text-editor-container .ql-snow .ql-picker.ql-header .ql-picker-label::before,
        .rich-text-editor-container .ql-snow .ql-picker.ql-header .ql-picker-item::before {
          content: 'Paragraph';
        }
        .rich-text-editor-container .ql-snow .ql-picker.ql-header .ql-picker-label[data-value="1"]::before,
        .rich-text-editor-container .ql-snow .ql-picker.ql-header .ql-picker-item[data-value="1"]::before {
          content: 'Heading 1';
        }
        .rich-text-editor-container .ql-snow .ql-picker.ql-header .ql-picker-label[data-value="2"]::before,
        .rich-text-editor-container .ql-snow .ql-picker.ql-header .ql-picker-item[data-value="2"]::before {
          content: 'Heading 2';
        }
        .rich-text-editor-container .ql-snow .ql-picker.ql-header .ql-picker-label[data-value="3"]::before,
        .rich-text-editor-container .ql-snow .ql-picker.ql-header .ql-picker-item[data-value="3"]::before {
          content: 'Heading 3';
        }
      `}</style>
    </div>
  );
}

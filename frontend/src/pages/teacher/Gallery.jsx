import React, { useEffect, useState, useContext } from 'react';
import { createPortal } from 'react-dom';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import { AuthContext } from '../../contexts/AuthContext';
import CustomSelect from '../../components/CustomSelect';
import {
  FiImage,
  FiFolder,
  FiCalendar,
  FiSearch,
  FiChevronLeft,
  FiChevronRight,
  FiX,
  FiEye,
  FiArrowRight,
  FiLayers,
  FiGrid,
  FiLayers as FiLayersIcon
} from 'react-icons/fi';

const Gallery = () => {
  const { user } = useContext(AuthContext);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedProjectId, setSelectedProjectId] = useState('all');

  // Modal Lightbox state
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxImages, setLightboxImages] = useState([]);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  // Project Overview Modal state
  const [overviewProject, setOverviewProject] = useState(null);

  useEffect(() => {
    const fetchGalleryData = async () => {
      setLoading(true);
      try {
        const response = await api.get('/projects', { params: { limit: 100 } });
        // Filter projects that have activities with images
        setProjects(response.data.projects || []);
      } catch (err) {
        console.error('Failed to load gallery projects:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchGalleryData();
  }, []);

  // Filter projects by search & project selection
  const filteredProjects = projects.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase());
    const matchesProject = selectedProjectId === 'all' || p.id === parseInt(selectedProjectId);
    return matchesSearch && matchesProject;
  });

  const openLightbox = (images, index, projectName = '', activityName = '') => {
    const formattedImages = images.map(img => ({
      ...img,
      projectName: projectName || img.projectName || '',
      activityName: activityName || img.activityName || ''
    }));
    setLightboxImages(formattedImages);
    setLightboxIndex(index);
    setLightboxOpen(true);
  };

  const handlePrev = () => {
    setLightboxIndex((prev) => (prev - 1 + lightboxImages.length) % lightboxImages.length);
  };

  const handleNext = () => {
    setLightboxIndex((prev) => (prev + 1) % lightboxImages.length);
  };

  useEffect(() => {
    if (!lightboxOpen && !overviewProject) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        if (lightboxOpen) setLightboxOpen(false);
        else if (overviewProject) setOverviewProject(null);
      } else if (lightboxOpen && e.key === 'ArrowLeft') {
        handlePrev();
      } else if (lightboxOpen && e.key === 'ArrowRight') {
        handleNext();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [lightboxOpen, lightboxImages, overviewProject]);

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* Top Banner Hero Card */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-6 md:p-8 text-white shadow-2xl border border-white/10">
        <div className="absolute -right-16 -bottom-16 w-64 h-64 bg-primary/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute right-1/3 -top-20 w-48 h-48 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-1.5 max-w-xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-xs font-bold text-indigo-200">
              <FiImage className="w-3.5 h-3.5 text-indigo-300" />
              <span>ภาพกิจกรรมโครงการ</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight">
              แกลเลอรีภาพกิจกรรม
            </h1>
            <p className="text-xs md:text-sm text-slate-300 font-medium leading-relaxed">
              ภาพบรรยากาศและความสำเร็จของกิจกรรมในแต่ละโครงการ
            </p>
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-white rounded-2xl shadow-soft border border-slate-100">
        {/* Search */}
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
            <FiSearch className="w-4 h-4" />
          </div>
          <input
            type="text"
            placeholder="ค้นหาภาพกิจกรรมตามชื่อโครงการ..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
          />
        </div>

        {/* Project Selector */}
        <div>
          <CustomSelect
            value={selectedProjectId}
            onChange={(val) => setSelectedProjectId(val)}
            icon={<FiFolder className="w-4 h-4" />}
            placeholder="ดูรูปภาพทุกโครงการ"
            options={[
              { value: 'all', label: `ดูรูปภาพทุกโครงการ (${projects.length} โครงการ)` },
              ...projects.map(p => ({
                value: p.id,
                label: p.name
              }))
            ]}
          />
        </div>
      </div>

      {/* Projects & Activities Gallery Grid */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-24 bg-white rounded-3xl border border-slate-100 shadow-soft">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary mb-3"></div>
          <p className="text-xs font-bold text-slate-500">กำลังโหลดคลังภาพกิจกรรม...</p>
        </div>
      ) : filteredProjects.length > 0 ? (
        <div className="space-y-6">
          {filteredProjects.map((project) => {
            // Collect all images from project activities
            const projectActivitiesWithImages = (project.activities || []).filter(a => a.images && a.images.length > 0);
            const totalProjectImages = projectActivitiesWithImages.reduce((sum, act) => sum + act.images.length, 0);

            return (
              <div key={project.id} className="bg-white rounded-3xl shadow-soft border border-slate-100 p-5 space-y-4 transition-all hover:shadow-md">
                {/* Project Header Title */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3.5">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-lg bg-primary/10 text-primary border border-primary/20">
                        ปีงบประมาณ {project.fiscalYear?.year}
                      </span>
                      <span className="text-[10px] text-slate-500 font-bold flex items-center gap-1 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200/60">
                        <FiFolder className="w-3 h-3 text-slate-400" />
                        {project.department?.name || 'ส่วนกลาง'}
                      </span>
                    </div>
                    <h2 className="text-sm md:text-base font-extrabold text-slate-800">{project.name}</h2>
                  </div>

                  <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
                    {totalProjectImages > 0 && (
                      <button
                        type="button"
                        onClick={() => setOverviewProject(project)}
                        className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-extrabold text-white bg-gradient-to-r from-primary via-indigo-600 to-violet-600 hover:from-primary-dark hover:to-violet-700 transition-all shadow-md shadow-primary/20 hover:shadow-lg active:scale-95 cursor-pointer"
                        title="ดูรูปภาพรวมทุกกิจกรรมของโครงการนี้"
                      >
                        <FiLayers className="w-3.5 h-3.5" />
                        <span>ภาพรวมโครงการ ({totalProjectImages} รูป)</span>
                      </button>
                    )}

                    <Link
                      to={`/projects/${project.id}`}
                      className="inline-flex items-center gap-1 text-xs font-bold text-primary hover:underline shrink-0"
                    >
                      <span>รายละเอียดโครงการ</span>
                      <FiArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>

                {/* Activities photo galleries */}
                {projectActivitiesWithImages.length > 0 ? (
                  <div className="space-y-4">
                    {projectActivitiesWithImages.map((activity) => (
                      <div key={activity.id} className="bg-slate-50/70 rounded-2xl p-3.5 border border-slate-100 space-y-2.5">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-primary"></span>
                            <h3 className="text-xs font-extrabold text-slate-800">{activity.name}</h3>
                            <span className="text-[10px] font-bold text-slate-400">({activity.images.length} รูป)</span>
                          </div>
                          <span className="text-[10px] text-slate-500 font-bold flex items-center gap-1">
                            <FiCalendar className="w-3 h-3 text-slate-400" />
                            {new Date(activity.activityDate).toLocaleDateString('th-TH')}
                          </span>
                        </div>

                        {/* Compact Thumbnail Grid (Columns: 4 to 12) */}
                        <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 xl:grid-cols-12 gap-2">
                          {activity.images.map((img, idx) => (
                            <div
                              key={img.id}
                              onClick={() => openLightbox(activity.images, idx, project.name, activity.name)}
                              className="group relative aspect-square rounded-xl overflow-hidden bg-slate-200/80 border border-slate-200/80 cursor-pointer shadow-2xs hover:shadow-md transition-all hover:-translate-y-0.5"
                            >
                              <img
                                src={`http://localhost:5000${img.filePath}`}
                                alt={img.originalName || activity.name}
                                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                                onError={(e) => { e.target.src = 'https://via.placeholder.com/300?text=BRU+Image'; }}
                              />
                              <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                                <FiEye className="w-4 h-4 transform group-hover:scale-110 transition-transform" />
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6 bg-slate-50 rounded-2xl border border-dashed border-slate-200 text-xs text-slate-400 font-semibold">
                    ยังไม่มีการอัปโหลดภาพกิจกรรมในโครงการนี้
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        /* Overall Empty State */
        <div className="text-center py-24 bg-white rounded-3xl shadow-soft border border-slate-100 space-y-3">
          <div className="w-16 h-16 rounded-3xl bg-slate-100 text-slate-300 flex items-center justify-center mx-auto">
            <FiImage className="w-8 h-8" />
          </div>
          <h3 className="text-sm font-bold text-slate-700">ไม่พบโครงการ หรือภาพกิจกรรมในระบบ</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto font-medium">
            ลองปรับเปลี่ยนคำค้นหา หรือเลือกดูโครงการอื่นๆ เพื่อดูแกลเลอรีภาพกิจกรรม
          </p>
        </div>
      )}

      {/* Project Overview Gallery Modal */}
      {overviewProject && createPortal(
        <div
          className="fixed inset-0 z-[9999] bg-black/65 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-fadeIn"
          onClick={() => setOverviewProject(null)}
        >
          <div
            className="relative w-full max-w-4xl bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden transform transition-all duration-300 max-h-[90vh] flex flex-col my-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-primary via-indigo-600 to-violet-600 p-5 text-white flex items-center justify-between shrink-0 relative overflow-hidden">
              <div className="absolute -right-6 -bottom-6 w-28 h-28 bg-white/10 rounded-full blur-xl pointer-events-none" />
              <div className="space-y-1 relative z-10">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-white/20 text-white backdrop-blur-md">
                    ภาพรวมรูปภาพกิจกรรม
                  </span>
                  <span className="text-xs text-white/80 font-medium">
                    ปีงบประมาณ {overviewProject.fiscalYear?.year}
                  </span>
                </div>
                <h2 className="text-lg font-extrabold text-white truncate max-w-2xl">{overviewProject.name}</h2>
                <p className="text-xs text-white/80 font-medium">
                  {overviewProject.department?.name || 'ส่วนกลาง'} • รวมทั้งหมด{' '}
                  {(overviewProject.activities || []).reduce((acc, a) => acc + (a.images?.length || 0), 0)} รูปภาพ
                </p>
              </div>

              <button
                type="button"
                onClick={() => setOverviewProject(null)}
                className="w-10 h-10 flex items-center justify-center text-white bg-white/10 hover:bg-white/25 active:scale-90 rounded-2xl backdrop-blur-md transition-all duration-150 cursor-pointer focus:outline-none border border-white/20 shadow-sm shrink-0"
                title="ปิดหน้าต่าง (Esc)"
              >
                <FiX className="w-5 h-5 stroke-[2.5]" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 overflow-y-auto space-y-6 min-h-0">
              {(() => {
                const activities = (overviewProject.activities || []).filter(a => a.images && a.images.length > 0);
                const allImages = activities.flatMap(a => 
                  a.images.map(img => ({ ...img, activityName: a.name, activityDate: a.activityDate }))
                );

                if (allImages.length === 0) {
                  return (
                    <div className="text-center py-12 text-slate-400 text-xs font-medium">
                      ไม่มีรูปภาพในโครงการนี้
                    </div>
                  );
                }

                return (
                  <div className="space-y-5">
                    {activities.map((act) => (
                      <div key={act.id} className="space-y-2.5">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                          <h3 className="text-xs font-extrabold text-slate-800 flex items-center gap-2">
                            <FiGrid className="w-4 h-4 text-primary" />
                            <span>{act.name}</span>
                            <span className="text-[10px] font-bold text-slate-400">({act.images.length} รูป)</span>
                          </h3>
                          <span className="text-[10px] font-semibold text-slate-400">
                            {new Date(act.activityDate).toLocaleDateString('th-TH')}
                          </span>
                        </div>

                        {/* Compact Grid inside overview modal */}
                        <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-2">
                          {act.images.map((img, idx) => (
                            <div
                              key={img.id}
                              onClick={() => openLightbox(act.images, idx, overviewProject.name, act.name)}
                              className="group relative aspect-square rounded-xl overflow-hidden bg-slate-100 border border-slate-200/80 cursor-pointer shadow-2xs hover:shadow-md transition-all hover:-translate-y-0.5"
                            >
                              <img
                                src={`http://localhost:5000${img.filePath}`}
                                alt={img.originalName || act.name}
                                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                                onError={(e) => { e.target.src = 'https://via.placeholder.com/300?text=BRU+Image'; }}
                              />
                              <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                                <FiEye className="w-4 h-4 transform group-hover:scale-110 transition-transform" />
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                );
              })()}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-end shrink-0">
              <button
                type="button"
                onClick={() => setOverviewProject(null)}
                className="px-5 py-2.5 text-xs font-bold text-slate-600 bg-white hover:bg-slate-100 border border-slate-200 rounded-xl transition-all shadow-sm cursor-pointer"
              >
                ปิดหน้าต่าง
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Lightbox Modal Full-Screen Portal */}
      {lightboxOpen && lightboxImages.length > 0 && createPortal(
        <div
          className="fixed inset-0 z-[99999] bg-black backdrop-blur-md flex flex-col items-center justify-center p-2 sm:p-6 cursor-pointer select-none"
          onClick={() => setLightboxOpen(false)}
        >
          <button
            onClick={() => setLightboxOpen(false)}
            className="absolute top-4 right-4 z-50 p-2.5 bg-white/10 hover:bg-white/20 text-white rounded-full transition-colors shadow-lg border border-white/10 cursor-pointer"
            title="ปิด (Esc)"
          >
            <FiX className="w-6 h-6 stroke-[2.5]" />
          </button>

          {lightboxImages.length > 1 && (
            <button
              onClick={(e) => { e.stopPropagation(); handlePrev(); }}
              className="absolute left-4 sm:left-8 top-1/2 -translate-y-1/2 z-50 p-3 bg-white/10 hover:bg-white/20 text-white rounded-full transition-all border border-white/10 hover:scale-105 cursor-pointer"
              title="ก่อนหน้า"
            >
              <FiChevronLeft className="w-6 h-6" />
            </button>
          )}

          <div
            className="w-full h-full max-w-6xl max-h-[90vh] flex flex-col items-center justify-center cursor-default p-2"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Centered Top Header Bar with 5px gap to Image */}
            {(lightboxImages[lightboxIndex]?.projectName || lightboxImages[lightboxIndex]?.activityName) && (
              <div className="flex items-center justify-center gap-2 sm:gap-3 flex-wrap mb-[5px] text-center max-w-4xl z-40">
                {lightboxImages[lightboxIndex]?.projectName && (
                  <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-white/15 backdrop-blur-md border border-white/20 text-white text-xs font-bold shadow-lg">
                    <span className="text-amber-400 text-[10px] uppercase font-black tracking-wider shrink-0">โครงการ:</span>
                    <span className="truncate max-w-[280px] sm:max-w-md">{lightboxImages[lightboxIndex].projectName}</span>
                  </div>
                )}

                {lightboxImages[lightboxIndex]?.activityName && (
                  <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-white/15 backdrop-blur-md border border-white/20 text-white text-xs font-bold shadow-lg">
                    <span className="text-indigo-300 text-[10px] uppercase font-black tracking-wider shrink-0">กิจกรรม:</span>
                    <span className="truncate max-w-[280px] sm:max-w-md">{lightboxImages[lightboxIndex].activityName}</span>
                  </div>
                )}
              </div>
            )}

            <img
              src={`http://localhost:5000${lightboxImages[lightboxIndex]?.filePath}`}
              alt="Activity Photo"
              className="max-w-full max-h-[68vh] object-contain rounded-xl shadow-2xl transition-all duration-200"
            />
            <div className="mt-[5px] text-xs text-white/90 font-medium text-center bg-white/10 backdrop-blur-md px-4 py-1 rounded-full border border-white/10 shadow-lg">
              ภาพที่ {lightboxIndex + 1} จาก {lightboxImages.length}
            </div>

            {/* Thumbnails list at the bottom of image container */}
            {lightboxImages.length > 1 && (
              <div className="flex items-center justify-center gap-2 mt-4 max-w-full overflow-x-auto py-1 px-2 select-none z-50">
                {lightboxImages.map((img, idx) => {
                  const isActive = idx === lightboxIndex;
                  return (
                    <button
                      key={img.id || idx}
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setLightboxIndex(idx);
                      }}
                      className={`relative w-12 h-9 rounded-lg overflow-hidden border-2 transition-all shrink-0 cursor-pointer active:scale-95 ${
                        isActive ? 'border-primary scale-105 shadow-md shadow-primary/40' : 'border-white/20 opacity-50 hover:opacity-100 hover:border-white/50'
                      }`}
                    >
                      <img src={`http://localhost:5000${img.filePath}`} alt="thumbnail" className="w-full h-full object-cover" />
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {lightboxImages.length > 1 && (
            <button
              onClick={(e) => { e.stopPropagation(); handleNext(); }}
              className="absolute right-4 sm:right-8 top-1/2 -translate-y-1/2 z-50 p-3 bg-white/10 hover:bg-white/20 text-white rounded-full transition-all border border-white/10 hover:scale-105 cursor-pointer"
              title="ถัดไป"
            >
              <FiChevronRight className="w-6 h-6" />
            </button>
          )}
        </div>,
        document.body
      )}
    </div>
  );
};

export default Gallery;

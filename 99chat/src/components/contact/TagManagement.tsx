import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Plus, Tag as TagIcon, Edit2, Trash2, X, Check, UserPlus } from "lucide-react";
import { useAppStore } from "../../store/app-store";

export default function TagManagement() {
  const navigate = useNavigate();
  const tags = useAppStore((s) => s.tags);
  const friends = useAppStore((s) => s.friends);
  const loadTags = useAppStore((s) => s.loadTags);
  const createTag = useAppStore((s) => s.createTag);
  const updateTag = useAppStore((s) => s.updateTag);
  const deleteTag = useAppStore((s) => s.deleteTag);

  const [selectedTagID, setSelectedTagID] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [tagName, setTagName] = useState("");
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [showAddMember, setShowAddMember] = useState(false);
  const [addMemberTagID, setAddMemberTagID] = useState<string | null>(null);
  const [confirmDeleteTagID, setConfirmDeleteTagID] = useState<string | null>(null);
  const [confirmRemoveMember, setConfirmRemoveMember] = useState<{ tagID: string; userID: string; memberName: string } | null>(null);

  useEffect(() => { loadTags(); }, [loadTags]);

  const selectedTag = tags.find((t) => t.tagID === selectedTagID);

  const handleCreate = () => {
    if (!tagName.trim()) return;
    createTag(tagName.trim(), selectedMembers);
    setTagName("");
    setSelectedMembers([]);
    setShowCreate(false);
  };

  const handleEdit = () => {
    if (!selectedTagID || !tagName.trim()) return;
    updateTag(selectedTagID, tagName.trim(), selectedMembers);
    setTagName("");
    setSelectedMembers([]);
    setShowEdit(false);
  };

  const handleDelete = (tagID: string) => {
    deleteTag(tagID);
    if (selectedTagID === tagID) setSelectedTagID(null);
  };

  const toggleMember = (userID: string) => {
    setSelectedMembers((prev) =>
      prev.includes(userID) ? prev.filter((id) => id !== userID) : [...prev, userID]
    );
  };

  const handleAddMember = (tagID: string) => {
    setAddMemberTagID(tagID);
    setSelectedMembers([]);
    setShowAddMember(true);
  };

  const confirmAddMember = () => {
    if (!addMemberTagID) return;
    const tag = tags.find((t) => t.tagID === addMemberTagID);
    if (tag) {
      updateTag(addMemberTagID, tag.name, [...new Set([...tag.memberIDs, ...selectedMembers])]);
    }
    setShowAddMember(false);
    setAddMemberTagID(null);
    setSelectedMembers([]);
  };

  const removeMember = (tagID: string, userID: string) => {
    const tag = tags.find((t) => t.tagID === tagID);
    if (tag) {
      updateTag(tagID, tag.name, tag.memberIDs.filter((id) => id !== userID));
    }
  };

  const openEdit = (_tagID: string, name: string, memberIDs: string[]) => {
    setTagName(name);
    setSelectedMembers(memberIDs);
    setShowEdit(true);
  };

  const confirmDeleteTag = tags.find((t) => t.tagID === confirmDeleteTagID);

  return (
    <div className="flex-1 flex flex-col bg-gray-50 overflow-y-auto">
      <div className="bg-white px-5 py-4 border-b border-gray-100 flex items-center gap-3">
        <button onClick={() => navigate("/contact")} className="text-gray-400 hover:text-gray-600">
          <ArrowLeft size={20} />
        </button>
        <h2 className="text-base font-semibold text-gray-800">标签管理</h2>
        <button
          onClick={() => { setTagName(""); setSelectedMembers([]); setShowCreate(true); }}
          className="ml-auto flex items-center gap-1 px-3 py-1.5 bg-primary-500 text-white rounded-lg text-sm hover:bg-primary-600 transition-colors"
        >
          <Plus size={16} /> 创建标签
        </button>
      </div>

      <div className="p-4 space-y-2">
        {tags.length === 0 && !selectedTag && (
          <div className="flex flex-col items-center justify-center py-20 text-gray-300 text-sm gap-2">
            <TagIcon size={32} className="opacity-30" />
            <span>暂无标签</span>
            <span className="text-xs">创建标签来分组管理好友</span>
          </div>
        )}
        {tags.map((tag) => (
          <div key={tag.tagID} className="bg-white rounded-xl border border-gray-100 overflow-hidden">
            <div
              onClick={() => setSelectedTagID(selectedTagID === tag.tagID ? null : tag.tagID)}
              className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-gray-50 transition-colors"
            >
              <div className="w-9 h-9 rounded-lg bg-amber-50 flex items-center justify-center text-amber-500 flex-shrink-0">
                <TagIcon size={18} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-700 truncate">{tag.name}</p>
                <p className="text-xs text-gray-400">{tag.memberIDs.length} 人</p>
              </div>
              <button
                onClick={(e) => { e.stopPropagation(); openEdit(tag.tagID, tag.name, tag.memberIDs); }}
                className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-400 hover:text-gray-600"
              >
                <Edit2 size={15} />
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); setConfirmDeleteTagID(tag.tagID); }}
                className="w-8 h-8 rounded-lg hover:bg-red-50 flex items-center justify-center text-gray-400 hover:text-red-500"
              >
                <Trash2 size={15} />
              </button>
            </div>
            {selectedTagID === tag.tagID && (
              <div className="border-t border-gray-50 px-4 py-2 bg-gray-50/50">
                {tag.memberIDs.length === 0 ? (
                  <p className="text-xs text-gray-400 py-2">暂无成员</p>
                ) : (
                  <div className="flex flex-wrap gap-2 py-2">
                    {tag.memberIDs.map((uid) => {
                      const f = friends.find((fr) => fr.userID === uid);
                      const memberName = f?.remark || f?.nickname || uid;
                      return (
                        <div key={uid} className="flex items-center gap-1.5 bg-white rounded-full pl-1 pr-2 py-0.5 border border-gray-100">
                          <img src={f?.faceURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${uid}`} alt="" className="w-5 h-5 rounded-full" />
                          <span className="text-xs text-gray-600">{memberName}</span>
                          <button onClick={() => setConfirmRemoveMember({ tagID: tag.tagID, userID: uid, memberName })} className="text-gray-300 hover:text-red-400">
                            <X size={12} />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
                <button
                  onClick={() => handleAddMember(tag.tagID)}
                  className="flex items-center gap-1 text-xs text-primary-500 hover:text-primary-600 mt-1"
                >
                  <UserPlus size={14} /> 添加成员
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Create/Edit tag modal */}
      {(showCreate || showEdit) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={() => { setShowCreate(false); setShowEdit(false); }}>
          <div className="bg-white rounded-2xl w-96 max-w-[90%] max-h-[80vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
            <div className="px-5 py-4 border-b border-gray-100">
              <h3 className="text-base font-semibold text-gray-800">{showCreate ? "创建标签" : "编辑标签"}</h3>
            </div>
            <div className="flex-1 overflow-y-auto px-5 py-4">
              <input
                autoFocus
                value={tagName}
                onChange={(e) => setTagName(e.target.value)}
                placeholder="标签名称"
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-primary-400 mb-4"
              />
              <p className="text-xs text-gray-400 mb-2">选择成员（{selectedMembers.length}）</p>
              <div className="space-y-1 max-h-60 overflow-y-auto">
                {friends.map((f) => (
                  <button
                    key={f.userID}
                    onClick={() => toggleMember(f.userID)}
                    className="w-full flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                      selectedMembers.includes(f.userID) ? "bg-primary-500 border-primary-500" : "border-gray-300"
                    }`}>
                      {selectedMembers.includes(f.userID) && <Check size={12} className="text-white" />}
                    </div>
                    <img src={f.faceURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${f.userID}`} alt="" className="w-8 h-8 rounded-full bg-gray-100" />
                    <span className="text-sm text-gray-700">{f.remark || f.nickname || f.userID}</span>
                  </button>
                ))}
                {friends.length === 0 && <p className="text-xs text-gray-400 text-center py-4">暂无好友</p>}
              </div>
            </div>
            <div className="flex gap-3 justify-end px-5 py-4 border-t border-gray-100">
              <button onClick={() => { setShowCreate(false); setShowEdit(false); }} className="px-4 py-2 text-sm text-gray-500 hover:text-gray-700">取消</button>
              <button
                onClick={showCreate ? handleCreate : handleEdit}
                disabled={!tagName.trim()}
                className={`px-4 py-2 text-sm text-white rounded-lg transition-colors ${tagName.trim() ? "bg-primary-500 hover:bg-primary-600" : "bg-gray-200"}`}
              >
                {showCreate ? "创建" : "保存"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add member modal */}
      {showAddMember && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={() => setShowAddMember(false)}>
          <div className="bg-white rounded-2xl w-80 max-w-[90%] max-h-[70vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
            <div className="px-5 py-4 border-b border-gray-100">
              <h3 className="text-base font-semibold text-gray-800">添加成员</h3>
            </div>
            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-1">
              {friends.filter((f) => {
                const tag = tags.find((t) => t.tagID === addMemberTagID);
                return !tag?.memberIDs.includes(f.userID);
              }).map((f) => (
                <button
                  key={f.userID}
                  onClick={() => toggleMember(f.userID)}
                  className="w-full flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                    selectedMembers.includes(f.userID) ? "bg-primary-500 border-primary-500" : "border-gray-300"
                  }`}>
                    {selectedMembers.includes(f.userID) && <Check size={12} className="text-white" />}
                  </div>
                  <img src={f.faceURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${f.userID}`} alt="" className="w-8 h-8 rounded-full bg-gray-100" />
                  <span className="text-sm text-gray-700">{f.remark || f.nickname || f.userID}</span>
                </button>
              ))}
            </div>
            <div className="flex gap-3 justify-end px-5 py-4 border-t border-gray-100">
              <button onClick={() => setShowAddMember(false)} className="px-4 py-2 text-sm text-gray-500 hover:text-gray-700">取消</button>
              <button onClick={confirmAddMember} className="px-4 py-2 text-sm bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors">确定</button>
            </div>
          </div>
        </div>
      )}

      {/* Delete tag confirmation */}
      {confirmDeleteTag && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={() => setConfirmDeleteTagID(null)}>
          <div className="bg-white rounded-2xl p-6 w-72 max-w-[90%] flex flex-col items-center gap-4" onClick={(e) => e.stopPropagation()}>
            <p className="text-sm text-gray-700 text-center">确定删除标签 '{confirmDeleteTag.name}'？</p>
            <div className="flex gap-3 w-full">
              <button onClick={() => setConfirmDeleteTagID(null)} className="flex-1 px-4 py-2 text-sm text-gray-500 hover:text-gray-700 border border-gray-200 rounded-lg">取消</button>
              <button onClick={() => { handleDelete(confirmDeleteTag.tagID); setConfirmDeleteTagID(null); }} className="flex-1 px-4 py-2 text-sm text-white bg-red-500 hover:bg-red-600 rounded-lg">删除</button>
            </div>
          </div>
        </div>
      )}

      {/* Remove member confirmation */}
      {confirmRemoveMember && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={() => setConfirmRemoveMember(null)}>
          <div className="bg-white rounded-2xl p-6 w-72 max-w-[90%] flex flex-col items-center gap-4" onClick={(e) => e.stopPropagation()}>
            <p className="text-sm text-gray-700 text-center">确定将 '{confirmRemoveMember.memberName}' 移出标签？</p>
            <div className="flex gap-3 w-full">
              <button onClick={() => setConfirmRemoveMember(null)} className="flex-1 px-4 py-2 text-sm text-gray-500 hover:text-gray-700 border border-gray-200 rounded-lg">取消</button>
              <button onClick={() => { removeMember(confirmRemoveMember.tagID, confirmRemoveMember.userID); setConfirmRemoveMember(null); }} className="flex-1 px-4 py-2 text-sm text-white bg-red-500 hover:bg-red-600 rounded-lg">移出</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

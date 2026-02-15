import React, { useState, useEffect, useCallback } from 'react';
import {
  IoHandLeftOutline,
  IoAddOutline,
  IoPeopleOutline,
  IoDocumentOutline,
  IoCalendarOutline,
  IoCheckmarkCircleOutline,
  IoCloseCircleOutline,
  IoTrashOutline,
  IoArrowUpOutline,
  IoArrowDownOutline,
  IoDownloadOutline,
  IoTimeOutline,
  IoLocationOutline,
  IoChevronBackOutline,
  IoPersonOutline,
  IoPersonAddOutline,
  IoShieldCheckmarkOutline,
  IoSchoolOutline,
  IoPlayOutline,
  IoRocketOutline,
  IoBarChartOutline,
  IoBookOutline,
} from 'react-icons/io5';
import { useAppContext } from '../context/AppContext';
import { usePermissions } from '../src/hooks/usePermissions';
import { Permission } from '../src/utils/permissions';
import * as serveTeamsApi from '../src/api/serve-teams';
import { addTeamMember } from '../src/api/serve-teams';
import { getAcademyTracks, enrollInAcademyTrack } from '../src/api/academy';
import { getUsers } from '../src/api/users';
import type { User } from '../src/api/users';
import type {
  ServeTeam,
  TeamMembership,
  TeamApplication,
  TeamResource,
  TeamEvent,
  TeamMemberRole,
  TeamTrainingData,
  TeamMemberProgressData,
  AcademyTrack,
  AcademyEnrollment,
  AcademyModuleProgress,
  TeamTrackAssignment,
} from '../types';

type TabView = 'overview' | 'roster' | 'resources' | 'events' | 'training';

const ServeTeamPage: React.FC = () => {
  const { currentUser } = useAppContext();
  const { can, isAdmin, isSuperAdmin } = usePermissions();

  const [teams, setTeams] = useState<ServeTeam[]>([]);
  const [myTeams, setMyTeams] = useState<TeamMembership[]>([]);
  const [selectedTeam, setSelectedTeam] = useState<ServeTeam | null>(null);
  const [activeTab, setActiveTab] = useState<TabView>('overview');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Sub-data
  const [applications, setApplications] = useState<TeamApplication[]>([]);
  const [resources, setResources] = useState<TeamResource[]>([]);
  const [events, setEvents] = useState<TeamEvent[]>([]);

  // Modals
  const [showCreateTeam, setShowCreateTeam] = useState(false);
  const [showAddResource, setShowAddResource] = useState(false);
  const [showCreateEvent, setShowCreateEvent] = useState(false);
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [showAddMember, setShowAddMember] = useState(false);

  const isOrgAdmin = isAdmin() || isSuperAdmin();

  // Get current user's role in the selected team
  const myMembership = selectedTeam
    ? myTeams.find((m) => m.teamId === selectedTeam.id)
    : null;
  const isTeamLeader = myMembership?.role === 'LEADER' || isOrgAdmin;

  const loadTeams = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [allTeams, userTeams] = await Promise.all([
        serveTeamsApi.getServeTeams(),
        serveTeamsApi.getMyTeams(),
      ]);
      setTeams(allTeams);
      setMyTeams(userTeams);
    } catch (err: any) {
      setError(err.message || 'Failed to load teams');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTeams();
  }, [loadTeams]);

  const selectTeam = async (teamId: string) => {
    try {
      setLoading(true);
      const team = await serveTeamsApi.getServeTeam(teamId);
      setSelectedTeam(team);
      setActiveTab('overview');

      // Load sub-data in parallel
      const [res, evt] = await Promise.all([
        serveTeamsApi.getTeamResources(teamId),
        serveTeamsApi.getTeamEvents(teamId),
      ]);
      setResources(res);
      setEvents(evt);

      // Load applications if leader/admin
      if (isOrgAdmin || myTeams.find((m) => m.teamId === teamId && m.role === 'LEADER')) {
        const apps = await serveTeamsApi.getTeamApplications(teamId, 'PENDING');
        setApplications(apps);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleReviewApplication = async (appId: string, decision: 'APPROVED' | 'REJECTED') => {
    try {
      await serveTeamsApi.reviewApplication(appId, decision);
      setApplications((prev) => prev.filter((a) => a.id !== appId));
      if (selectedTeam) {
        const team = await serveTeamsApi.getServeTeam(selectedTeam.id);
        setSelectedTeam(team);
      }
      await loadTeams();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleRemoveFromRoster = async (userId: string) => {
    if (!selectedTeam || !window.confirm('Remove this member from the team?')) return;
    try {
      await serveTeamsApi.removeFromRoster(selectedTeam.id, userId);
      const team = await serveTeamsApi.getServeTeam(selectedTeam.id);
      setSelectedTeam(team);
      await loadTeams();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleUpdateRole = async (userId: string, newRole: TeamMemberRole) => {
    if (!selectedTeam) return;
    try {
      await serveTeamsApi.updateTeamMemberRole(selectedTeam.id, userId, newRole);
      const team = await serveTeamsApi.getServeTeam(selectedTeam.id);
      setSelectedTeam(team);
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleDeleteResource = async (resourceId: string) => {
    if (!selectedTeam || !window.confirm('Delete this resource?')) return;
    try {
      await serveTeamsApi.deleteTeamResource(selectedTeam.id, resourceId);
      setResources((prev) => prev.filter((r) => r.id !== resourceId));
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleDeleteEvent = async (eventId: string) => {
    if (!selectedTeam || !window.confirm('Delete this event?')) return;
    try {
      await serveTeamsApi.deleteTeamEvent(selectedTeam.id, eventId);
      setEvents((prev) => prev.filter((e) => e.id !== eventId));
    } catch (err: any) {
      alert(err.message);
    }
  };

  // ========== TEAM LIST VIEW ==========
  if (!selectedTeam) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-800">Serve Teams</h1>
          {can(Permission.SERVE_TEAM_CREATE) && (
            <button
              onClick={() => setShowCreateTeam(true)}
              className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-xl hover:bg-navy transition-colors"
            >
              <IoAddOutline size={20} />
              Create Team
            </button>
          )}
        </div>

        {error && (
          <div className="bg-red-50 text-red-700 p-4 rounded-lg">{error}</div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
          </div>
        ) : teams.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12">
            <div className="flex flex-col items-center justify-center text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                <IoHandLeftOutline size={32} className="text-gray-400" />
              </div>
              <h2 className="text-xl font-semibold text-gray-700 mb-2">No Serve Teams Yet</h2>
              <p className="text-gray-500 max-w-md">
                {isOrgAdmin
                  ? 'Create your first serve team to start organizing volunteers.'
                  : 'No teams are available yet. Check back soon!'}
              </p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {teams.map((team) => {
              const membership = myTeams.find((m) => m.teamId === team.id);
              return (
                <div
                  key={team.id}
                  onClick={() => selectTeam(team.id)}
                  className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 hover:shadow-md hover:border-blue-300 transition-all cursor-pointer"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                        <IoHandLeftOutline size={24} className="text-blue-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-800">{team.name}</h3>
                        {membership && (
                          <span
                            className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                              membership.role === 'LEADER'
                                ? 'bg-amber-100 text-amber-700'
                                : membership.role === 'MEMBER'
                                ? 'bg-green-100 text-green-700'
                                : 'bg-gray-100 text-gray-600'
                            }`}
                          >
                            {membership.role}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  {team.description && (
                    <p className="text-sm text-gray-500 mb-4 line-clamp-2">{team.description}</p>
                  )}
                  <div className="flex items-center gap-4 text-sm text-gray-400">
                    <span className="flex items-center gap-1">
                      <IoPeopleOutline size={16} />
                      {team._count?.memberships || 0} members
                    </span>
                    <span className="flex items-center gap-1">
                      <IoDocumentOutline size={16} />
                      {team._count?.resources || 0}
                    </span>
                    <span className="flex items-center gap-1">
                      <IoCalendarOutline size={16} />
                      {team._count?.events || 0}
                    </span>
                  </div>
                  {team.requiredTrack && (
                    <div className="mt-3 flex items-center gap-1 text-xs text-purple-600 bg-purple-50 px-2 py-1 rounded-full w-fit">
                      <IoSchoolOutline size={14} />
                      Requires: {team.requiredTrack.title}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Create Team Modal */}
        {showCreateTeam && (
          <CreateTeamModal
            onClose={() => setShowCreateTeam(false)}
            onCreated={async () => {
              setShowCreateTeam(false);
              await loadTeams();
            }}
          />
        )}
      </div>
    );
  }

  // ========== TEAM DETAIL VIEW ==========
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => { setSelectedTeam(null); setActiveTab('overview'); }}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <IoChevronBackOutline size={20} />
        </button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-800">{selectedTeam.name}</h1>
          {selectedTeam.description && (
            <p className="text-gray-500 mt-1">{selectedTeam.description}</p>
          )}
        </div>
        {isTeamLeader ? (
          <button
            onClick={() => setShowAddMember(true)}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-xl hover:bg-navy transition-colors"
          >
            <IoPersonAddOutline size={20} />
            Add Team Member
          </button>
        ) : !myMembership && can(Permission.SERVE_TEAM_APPLY) ? (
          <button
            onClick={() => setShowApplyModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-xl hover:bg-navy transition-colors"
          >
            <IoAddOutline size={20} />
            Apply to Join
          </button>
        ) : null}
      </div>

      {error && <div className="bg-red-50 text-red-700 p-4 rounded-lg">{error}</div>}

      {/* Pending Applications Banner */}
      {isTeamLeader && applications.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
          <h3 className="font-semibold text-amber-800 mb-2">
            {applications.length} Pending Application{applications.length > 1 ? 's' : ''}
          </h3>
          <div className="space-y-2">
            {applications.map((app) => (
              <div key={app.id} className="flex items-center justify-between bg-white p-3 rounded-lg">
                <div>
                  <span className="font-medium text-gray-900">
                    {app.user?.firstName} {app.user?.lastName}
                  </span>
                  <span className="text-sm text-gray-500 ml-2">{app.user?.email}</span>
                  {app.message && <p className="text-sm text-gray-600 mt-1">{app.message}</p>}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleReviewApplication(app.id, 'APPROVED')}
                    className="flex items-center gap-1 px-3 py-1.5 bg-primary text-white text-sm rounded-xl hover:bg-navy"
                  >
                    <IoCheckmarkCircleOutline size={16} /> Approve
                  </button>
                  <button
                    onClick={() => handleReviewApplication(app.id, 'REJECTED')}
                    className="flex items-center gap-1 px-3 py-1.5 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700"
                  >
                    <IoCloseCircleOutline size={16} /> Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-lg w-fit">
        {(['overview', 'roster', 'resources', 'events', 'training'] as TabView[]).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-md text-sm font-medium capitalize transition-colors ${
              activeTab === tab
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <OverviewTab team={selectedTeam} myMembership={myMembership} />
      )}

      {activeTab === 'roster' && (
        <RosterTab
          team={selectedTeam}
          isLeader={isTeamLeader}
          onUpdateRole={handleUpdateRole}
          onRemoveMember={handleRemoveFromRoster}
        />
      )}

      {activeTab === 'resources' && (
        <ResourcesTab
          resources={resources}
          isLeader={isTeamLeader}
          onAddResource={() => setShowAddResource(true)}
          onDeleteResource={handleDeleteResource}
        />
      )}

      {activeTab === 'events' && (
        <EventsTab
          events={events}
          isLeader={isTeamLeader}
          onCreateEvent={() => setShowCreateEvent(true)}
          onDeleteEvent={handleDeleteEvent}
        />
      )}

      {activeTab === 'training' && selectedTeam && (
        <TrainingTab
          teamId={selectedTeam.id}
          isLeader={isTeamLeader}
          isOrgAdmin={isOrgAdmin}
          myMembership={myMembership}
        />
      )}

      {/* Modals */}
      {showApplyModal && selectedTeam && (
        <ApplyModal
          teamId={selectedTeam.id}
          onClose={() => setShowApplyModal(false)}
          onApplied={async () => {
            setShowApplyModal(false);
            await loadTeams();
          }}
        />
      )}

      {showAddMember && selectedTeam && (
        <AddMemberModal
          teamId={selectedTeam.id}
          onClose={() => setShowAddMember(false)}
          onAdded={() => {
            setShowAddMember(false);
            selectTeam(selectedTeam.id);
          }}
        />
      )}

      {showAddResource && selectedTeam && (
        <AddResourceModal
          teamId={selectedTeam.id}
          onClose={() => setShowAddResource(false)}
          onAdded={async (resource) => {
            setResources((prev) => [resource, ...prev]);
            setShowAddResource(false);
          }}
        />
      )}

      {showCreateEvent && selectedTeam && (
        <CreateEventModal
          teamId={selectedTeam.id}
          onClose={() => setShowCreateEvent(false)}
          onCreated={async (event) => {
            setEvents((prev) => [event, ...prev]);
            setShowCreateEvent(false);
          }}
        />
      )}
    </div>
  );
};

// ========== SUB-COMPONENTS ==========

const OverviewTab: React.FC<{ team: ServeTeam; myMembership: TeamMembership | null | undefined }> = ({ team, myMembership }) => {
  const leaders = team.memberships?.filter((m) => m.role === 'LEADER') || [];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Team Info */}
      <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <h3 className="font-semibold text-gray-800 mb-4">About This Team</h3>
        <p className="text-gray-600 mb-6">{team.description || 'No description provided.'}</p>

        <div className="grid grid-cols-3 gap-4">
          <div className="bg-blue-50 rounded-lg p-4 text-center">
            <IoPeopleOutline size={24} className="text-blue-600 mx-auto mb-1" />
            <div className="text-2xl font-bold text-gray-800">{team._count?.memberships || 0}</div>
            <div className="text-xs text-gray-500">Members</div>
          </div>
          <div className="bg-green-50 rounded-lg p-4 text-center">
            <IoDocumentOutline size={24} className="text-green-600 mx-auto mb-1" />
            <div className="text-2xl font-bold text-gray-800">{team._count?.resources || 0}</div>
            <div className="text-xs text-gray-500">Resources</div>
          </div>
          <div className="bg-purple-50 rounded-lg p-4 text-center">
            <IoCalendarOutline size={24} className="text-purple-600 mx-auto mb-1" />
            <div className="text-2xl font-bold text-gray-800">{team._count?.events || 0}</div>
            <div className="text-xs text-gray-500">Events</div>
          </div>
        </div>

        {team.requiredTrack && (
          <div className="mt-6 p-4 bg-purple-50 rounded-lg flex items-center gap-3">
            <IoSchoolOutline size={24} className="text-purple-600" />
            <div>
              <div className="font-medium text-purple-900">Required Academy Track</div>
              <div className="text-sm text-purple-700">{team.requiredTrack.title}</div>
            </div>
          </div>
        )}
      </div>

      {/* Leadership & Your Status */}
      <div className="space-y-6">
        {myMembership && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h3 className="font-semibold text-gray-800 mb-3">Your Status</h3>
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                myMembership.role === 'LEADER' ? 'bg-amber-100' : 'bg-green-100'
              }`}>
                {myMembership.role === 'LEADER' ? (
                  <IoShieldCheckmarkOutline size={20} className="text-amber-600" />
                ) : (
                  <IoPersonOutline size={20} className="text-green-600" />
                )}
              </div>
              <div>
                <div className="font-medium text-gray-900 capitalize">{myMembership.role.toLowerCase()}</div>
                <div className="text-xs text-gray-500">
                  Joined {new Date(myMembership.joinedAt).toLocaleDateString()}
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h3 className="font-semibold text-gray-800 mb-3">Team Leaders</h3>
          {leaders.length === 0 ? (
            <p className="text-sm text-gray-500">No leaders assigned yet.</p>
          ) : (
            <div className="space-y-3">
              {leaders.map((l) => (
                <div key={l.id} className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center text-amber-700 font-bold text-xs">
                    {l.user?.firstName?.charAt(0)}{l.user?.lastName?.charAt(0)}
                  </div>
                  <div>
                    <div className="text-sm font-medium text-gray-900">
                      {l.user?.firstName} {l.user?.lastName}
                    </div>
                    <div className="text-xs text-gray-500">{l.user?.email}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const RosterTab: React.FC<{
  team: ServeTeam;
  isLeader: boolean;
  onUpdateRole: (userId: string, role: TeamMemberRole) => void;
  onRemoveMember: (userId: string) => void;
}> = ({ team, isLeader, onUpdateRole, onRemoveMember }) => {
  const memberships = team.memberships || [];

  const roleOrder: Record<string, number> = { LEADER: 0, MEMBER: 1, TRAINEE: 2 };
  const sorted = [...memberships].sort((a, b) => (roleOrder[a.role] || 99) - (roleOrder[b.role] || 99));

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
      <div className="p-6 border-b border-gray-100">
        <h3 className="font-semibold text-gray-800">
          Team Roster ({memberships.length} member{memberships.length !== 1 ? 's' : ''})
        </h3>
      </div>
      {sorted.length === 0 ? (
        <div className="p-12 text-center text-gray-500">No members yet.</div>
      ) : (
        <div className="divide-y divide-gray-100">
          {sorted.map((m) => (
            <div key={m.id} className="flex items-center justify-between px-6 py-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 font-bold text-sm">
                  {m.user?.firstName?.charAt(0)}{m.user?.lastName?.charAt(0)}
                </div>
                <div>
                  <div className="font-medium text-gray-900">
                    {m.user?.firstName} {m.user?.lastName}
                  </div>
                  <div className="text-sm text-gray-500">{m.user?.email}</div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span
                  className={`text-xs px-2 py-1 rounded-full font-medium ${
                    m.role === 'LEADER'
                      ? 'bg-amber-100 text-amber-700'
                      : m.role === 'MEMBER'
                      ? 'bg-green-100 text-green-700'
                      : 'bg-gray-100 text-gray-600'
                  }`}
                >
                  {m.role}
                </span>
                {isLeader && (
                  <div className="flex items-center gap-1">
                    {m.role !== 'LEADER' && (
                      <button
                        onClick={() => onUpdateRole(m.userId, 'LEADER')}
                        className="p-1 text-gray-400 hover:text-amber-600 transition-colors"
                        title="Promote to Leader"
                      >
                        <IoArrowUpOutline size={16} />
                      </button>
                    )}
                    {m.role === 'LEADER' && (
                      <button
                        onClick={() => onUpdateRole(m.userId, 'MEMBER')}
                        className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
                        title="Demote to Member"
                      >
                        <IoArrowDownOutline size={16} />
                      </button>
                    )}
                    <button
                      onClick={() => onRemoveMember(m.userId)}
                      className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                      title="Remove from Team"
                    >
                      <IoTrashOutline size={16} />
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const ResourcesTab: React.FC<{
  resources: TeamResource[];
  isLeader: boolean;
  onAddResource: () => void;
  onDeleteResource: (id: string) => void;
}> = ({ resources, isLeader, onAddResource, onDeleteResource }) => {
  const typeIcons: Record<string, string> = { PDF: 'text-red-500', VIDEO: 'text-purple-500', LINK: 'text-blue-500', DOC: 'text-green-500' };

  return (
    <div className="space-y-4">
      {isLeader && (
        <div className="flex justify-end">
          <button
            onClick={onAddResource}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-xl hover:bg-navy transition-colors"
          >
            <IoAddOutline size={20} />
            Add Resource
          </button>
        </div>
      )}

      {resources.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
          <IoDocumentOutline size={48} className="text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">No resources uploaded yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {resources.map((r) => (
            <div key={r.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <IoDocumentOutline size={20} className={typeIcons[r.fileType] || 'text-gray-500'} />
                  <span className="text-xs font-medium text-gray-400 uppercase">{r.fileType}</span>
                </div>
                <div className="flex gap-1">
                  <a
                    href={r.fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
                    title="Download / View"
                  >
                    <IoDownloadOutline size={18} />
                  </a>
                  {isLeader && (
                    <button
                      onClick={() => onDeleteResource(r.id)}
                      className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                      title="Delete"
                    >
                      <IoTrashOutline size={18} />
                    </button>
                  )}
                </div>
              </div>
              <h4 className="font-medium text-gray-800 mb-1">{r.title}</h4>
              {r.description && <p className="text-sm text-gray-500 line-clamp-2">{r.description}</p>}
              <div className="mt-3 text-xs text-gray-400">
                By {r.uploadedBy?.firstName} {r.uploadedBy?.lastName} &middot;{' '}
                {new Date(r.createdAt).toLocaleDateString()}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const EventsTab: React.FC<{
  events: TeamEvent[];
  isLeader: boolean;
  onCreateEvent: () => void;
  onDeleteEvent: (id: string) => void;
}> = ({ events, isLeader, onCreateEvent, onDeleteEvent }) => {
  const now = new Date();
  const upcoming = events.filter((e) => new Date(e.startTime) >= now);
  const past = events.filter((e) => new Date(e.startTime) < now);

  return (
    <div className="space-y-6">
      {isLeader && (
        <div className="flex justify-end">
          <button
            onClick={onCreateEvent}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-xl hover:bg-navy transition-colors"
          >
            <IoAddOutline size={20} />
            Create Event
          </button>
        </div>
      )}

      {events.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
          <IoCalendarOutline size={48} className="text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">No events scheduled yet.</p>
        </div>
      ) : (
        <>
          {upcoming.length > 0 && (
            <div>
              <h3 className="font-semibold text-gray-700 mb-3">Upcoming</h3>
              <div className="space-y-3">
                {upcoming.map((e) => (
                  <EventCard key={e.id} event={e} isLeader={isLeader} onDelete={onDeleteEvent} />
                ))}
              </div>
            </div>
          )}
          {past.length > 0 && (
            <div>
              <h3 className="font-semibold text-gray-400 mb-3">Past Events</h3>
              <div className="space-y-3 opacity-70">
                {past.map((e) => (
                  <EventCard key={e.id} event={e} isLeader={isLeader} onDelete={onDeleteEvent} />
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

const EventCard: React.FC<{ event: TeamEvent; isLeader: boolean; onDelete: (id: string) => void }> = ({ event, isLeader, onDelete }) => (
  <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 flex items-start justify-between">
    <div className="flex gap-4">
      <div className="bg-purple-50 rounded-lg p-3 text-center min-w-[60px]">
        <div className="text-xs font-bold text-purple-600 uppercase">
          {new Date(event.startTime).toLocaleDateString(undefined, { month: 'short' })}
        </div>
        <div className="text-xl font-bold text-purple-900">
          {new Date(event.startTime).getDate()}
        </div>
      </div>
      <div>
        <h4 className="font-semibold text-gray-800">{event.title}</h4>
        {event.description && <p className="text-sm text-gray-500 mt-1">{event.description}</p>}
        <div className="flex gap-4 mt-2 text-xs text-gray-400">
          <span className="flex items-center gap-1">
            <IoTimeOutline size={14} />
            {new Date(event.startTime).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
            {event.endTime && ` - ${new Date(event.endTime).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}`}
          </span>
          {event.location && (
            <span className="flex items-center gap-1">
              <IoLocationOutline size={14} />
              {event.location}
            </span>
          )}
        </div>
      </div>
    </div>
    {isLeader && (
      <button
        onClick={() => onDelete(event.id)}
        className="p-1 text-gray-400 hover:text-red-600 transition-colors"
        title="Delete Event"
      >
        <IoTrashOutline size={18} />
      </button>
    )}
  </div>
);

// ========== TRAINING TAB ==========

type TrainingSubView = 'my-learning' | 'assignments' | 'progress';

const TrainingTab: React.FC<{
  teamId: string;
  isLeader: boolean;
  isOrgAdmin: boolean;
  myMembership: TeamMembership | null | undefined;
}> = ({ teamId, isLeader, isOrgAdmin, myMembership }) => {
  const [subView, setSubView] = useState<TrainingSubView>(
    isLeader ? 'assignments' : 'my-learning'
  );
  const [training, setTraining] = useState<TeamTrainingData | null>(null);
  const [memberProgress, setMemberProgress] = useState<TeamMemberProgressData | null>(null);
  const [assignments, setAssignments] = useState<TeamTrackAssignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAssignTrack, setShowAssignTrack] = useState(false);

  const loadTraining = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      if (subView === 'my-learning') {
        const data = await serveTeamsApi.getTeamTraining(teamId);
        setTraining(data);
      } else if (subView === 'assignments') {
        const data = await serveTeamsApi.getTeamTrackAssignments(teamId);
        setAssignments(data);
      } else if (subView === 'progress') {
        const data = await serveTeamsApi.getTeamMemberProgress(teamId);
        setMemberProgress(data);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load training data');
    } finally {
      setLoading(false);
    }
  }, [teamId, subView]);

  useEffect(() => {
    loadTraining();
  }, [loadTraining]);

  const handleUnassignTrack = async (trackId: string) => {
    if (!window.confirm('Remove this training assignment from the team?')) return;
    try {
      await serveTeamsApi.unassignTrackFromTeam(teamId, trackId);
      setAssignments((prev) => prev.filter((a) => a.trackId !== trackId));
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleEnroll = async (trackId: string) => {
    try {
      await enrollInAcademyTrack(trackId);
      await loadTraining();
    } catch (err: any) {
      alert(err.message);
    }
  };

  // Determine which sub-tabs to show
  const subTabs: { key: TrainingSubView; label: string }[] = [];
  if (myMembership) {
    subTabs.push({ key: 'my-learning', label: 'My Learning' });
  }
  if (isLeader || isOrgAdmin) {
    subTabs.push({ key: 'assignments', label: 'Assignments' });
    subTabs.push({ key: 'progress', label: 'Volunteer Progress' });
  }

  return (
    <div className="space-y-4">
      {/* Sub-tabs */}
      {subTabs.length > 1 && (
        <div className="flex gap-2">
          {subTabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setSubView(tab.key)}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                subView === tab.key
                  ? 'bg-white text-primary shadow-sm'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      )}

      {error && (
        <div className="bg-red-50 text-red-700 p-4 rounded-lg text-sm">{error}</div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
        </div>
      ) : (
        <>
          {subView === 'my-learning' && training && (
            <MyLearningSubView training={training} onEnroll={handleEnroll} />
          )}

          {subView === 'assignments' && (
            <AssignmentsSubView
              assignments={assignments}
              isOrgAdmin={isOrgAdmin}
              onAssign={() => setShowAssignTrack(true)}
              onUnassign={handleUnassignTrack}
            />
          )}

          {subView === 'progress' && memberProgress && (
            <VolunteerProgressSubView data={memberProgress} />
          )}
        </>
      )}

      {showAssignTrack && (
        <AssignTrackModal
          teamId={teamId}
          existingTrackIds={assignments.map((a) => a.trackId)}
          onClose={() => setShowAssignTrack(false)}
          onAssigned={async () => {
            setShowAssignTrack(false);
            await loadTraining();
          }}
        />
      )}
    </div>
  );
};

const MyLearningSubView: React.FC<{
  training: TeamTrainingData;
  onEnroll: (trackId: string) => void;
}> = ({ training, onEnroll }) => {
  const allTracks = [...training.assignedTracks, ...training.teamTracks];
  const enrolledTrackIds = new Set(training.enrollments.map((e) => e.trackId));

  if (allTracks.length === 0) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
        <IoSchoolOutline size={48} className="text-gray-300 mx-auto mb-3" />
        <h3 className="text-lg font-semibold text-gray-700 mb-2">No Training Assigned</h3>
        <p className="text-gray-500">No training tracks have been assigned to this team yet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Enrolled tracks with progress */}
      {allTracks.filter((t) => enrolledTrackIds.has(t.id)).length > 0 && (
        <div>
          <h3 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
            <IoBookOutline size={16} className="text-blue-600" />
            My Journey
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {allTracks
              .filter((t) => enrolledTrackIds.has(t.id))
              .map((track) => {
                const trackProgress = training.progress.filter(
                  (p) => p.module?.trackId === track.id
                );
                const totalModules = track.modules?.length || track._count?.modules || 0;
                const completedModules = trackProgress.filter(
                  (p) => p.status === 'COMPLETED'
                ).length;
                const percent = totalModules > 0 ? Math.round((completedModules / totalModules) * 100) : 0;
                const enrollment = training.enrollments.find((e) => e.trackId === track.id);

                return (
                  <div
                    key={track.id}
                    className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h4 className="font-semibold text-gray-800">{track.title}</h4>
                        {track.description && (
                          <p className="text-sm text-gray-500 mt-1 line-clamp-2">
                            {track.description}
                          </p>
                        )}
                      </div>
                      {enrollment?.completedAt && (
                        <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">
                          Completed
                        </span>
                      )}
                    </div>
                    <div className="mt-3">
                      <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                        <span>{completedModules}/{totalModules} modules</span>
                        <span>{percent}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-primary rounded-full h-2 transition-all"
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {/* Tracks not yet enrolled */}
      {allTracks.filter((t) => !enrolledTrackIds.has(t.id)).length > 0 && (
        <div>
          <h3 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
            <IoRocketOutline size={16} className="text-purple-600" />
            Available Training
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {allTracks
              .filter((t) => !enrolledTrackIds.has(t.id))
              .map((track) => (
                <div
                  key={track.id}
                  className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5"
                >
                  <h4 className="font-semibold text-gray-800 mb-1">{track.title}</h4>
                  {track.description && (
                    <p className="text-sm text-gray-500 mb-3 line-clamp-2">
                      {track.description}
                    </p>
                  )}
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-400">
                      {track._count?.modules || track.modules?.length || 0} modules
                    </span>
                    <button
                      onClick={() => onEnroll(track.id)}
                      className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-white bg-primary rounded-xl hover:bg-navy"
                    >
                      <IoRocketOutline size={14} />
                      Enroll
                    </button>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
};

const AssignmentsSubView: React.FC<{
  assignments: TeamTrackAssignment[];
  isOrgAdmin: boolean;
  onAssign: () => void;
  onUnassign: (trackId: string) => void;
}> = ({ assignments, isOrgAdmin, onAssign, onUnassign }) => {
  return (
    <div className="space-y-4">
      {isOrgAdmin && (
        <div className="flex justify-end">
          <button
            onClick={onAssign}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-xl hover:bg-navy transition-colors"
          >
            <IoAddOutline size={20} />
            Assign Training
          </button>
        </div>
      )}

      {assignments.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
          <IoSchoolOutline size={48} className="text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">No training tracks assigned to this team yet.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100">
            <h3 className="text-sm font-bold text-gray-700">
              Assigned Training ({assignments.length})
            </h3>
          </div>
          <div className="divide-y divide-gray-100">
            {assignments.map((a) => (
              <div key={a.id} className="flex items-center justify-between px-6 py-4">
                <div>
                  <div className="font-medium text-gray-900">{a.track?.title}</div>
                  {a.track?.description && (
                    <div className="text-sm text-gray-500 mt-0.5 line-clamp-1">{a.track.description}</div>
                  )}
                  <div className="text-xs text-gray-400 mt-1">
                    {a.track?._count?.modules || 0} modules &middot; {a.track?._count?.enrollments || 0} enrolled
                  </div>
                </div>
                {isOrgAdmin && (
                  <button
                    onClick={() => onUnassign(a.trackId)}
                    className="p-1.5 text-gray-400 hover:text-red-600 transition-colors"
                    title="Remove assignment"
                  >
                    <IoTrashOutline size={18} />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

const VolunteerProgressSubView: React.FC<{
  data: TeamMemberProgressData;
}> = ({ data }) => {
  if (data.memberProgress.length === 0) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
        <IoPeopleOutline size={48} className="text-gray-300 mx-auto mb-3" />
        <p className="text-gray-500">No team members to show progress for.</p>
      </div>
    );
  }

  if (data.tracks.length === 0) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
        <IoBarChartOutline size={48} className="text-gray-300 mx-auto mb-3" />
        <p className="text-gray-500">No training tracks assigned. Assign tracks first to see progress.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-100">
        <h3 className="text-sm font-bold text-gray-700">Volunteer Training Progress</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-100">
              <th className="text-left text-xs font-bold text-gray-400 uppercase px-6 py-3">
                Volunteer
              </th>
              <th className="text-left text-xs font-bold text-gray-400 uppercase px-6 py-3">
                Role
              </th>
              {data.tracks.map((track) => (
                <th
                  key={track.id}
                  className="text-left text-xs font-bold text-gray-400 uppercase px-6 py-3"
                >
                  {track.title}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.memberProgress.map((member) => (
              <tr key={member.userId} className="border-b border-gray-50 hover:bg-gray-50">
                <td className="px-6 py-3">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 font-bold text-xs">
                      {member.user?.firstName?.charAt(0)}{member.user?.lastName?.charAt(0)}
                    </div>
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {member.user?.firstName} {member.user?.lastName}
                      </div>
                      <div className="text-xs text-gray-400">{member.user?.email}</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-3">
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      member.role === 'LEADER'
                        ? 'bg-amber-100 text-amber-700'
                        : member.role === 'MEMBER'
                        ? 'bg-green-100 text-green-700'
                        : 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    {member.role}
                  </span>
                </td>
                {member.trackProgress.map((tp) => (
                  <td key={tp.trackId} className="px-6 py-3">
                    {!tp.enrolled ? (
                      <span className="text-xs text-gray-400">Not enrolled</span>
                    ) : tp.completedAt ? (
                      <span className="inline-flex items-center gap-1 text-xs text-green-700 bg-green-50 px-2 py-0.5 rounded-full">
                        <IoCheckmarkCircleOutline size={12} />
                        Complete
                      </span>
                    ) : (
                      <div className="flex items-center gap-2 min-w-[120px]">
                        <div className="flex-1 bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-primary rounded-full h-2 transition-all"
                            style={{ width: `${tp.progressPercent}%` }}
                          />
                        </div>
                        <span className="text-xs text-gray-500 w-8 text-right">
                          {tp.progressPercent}%
                        </span>
                      </div>
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const AssignTrackModal: React.FC<{
  teamId: string;
  existingTrackIds: string[];
  onClose: () => void;
  onAssigned: () => void;
}> = ({ teamId, existingTrackIds, onClose, onAssigned }) => {
  const [tracks, setTracks] = useState<AcademyTrack[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const all = await getAcademyTracks({ isPublished: true });
        // Filter out already-assigned tracks and team-scoped tracks
        setTracks(all.filter((t) => !existingTrackIds.includes(t.id)));
      } catch (err: any) {
        alert(err.message);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [existingTrackIds]);

  const handleAssign = async (trackId: string) => {
    try {
      setSubmitting(trackId);
      await serveTeamsApi.assignTrackToTeam(teamId, trackId);
      onAssigned();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSubmitting(null);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-6" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-lg font-bold text-gray-800 mb-4">Assign Training Track</h2>
        <p className="text-sm text-gray-500 mb-4">
          Select a training track to assign to all team members. Members will be automatically enrolled.
        </p>

        {loading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin w-6 h-6 border-4 border-primary border-t-transparent rounded-full" />
          </div>
        ) : tracks.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No available tracks to assign. All published tracks are already assigned.
          </div>
        ) : (
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {tracks.map((track) => (
              <div
                key={track.id}
                className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:border-blue-300 transition-colors"
              >
                <div>
                  <div className="font-medium text-gray-900">{track.title}</div>
                  {track.description && (
                    <div className="text-sm text-gray-500 line-clamp-1">{track.description}</div>
                  )}
                  <div className="text-xs text-gray-400 mt-1">
                    {track._count?.modules || 0} modules
                  </div>
                </div>
                <button
                  onClick={() => handleAssign(track.id)}
                  disabled={submitting === track.id}
                  className="px-3 py-1.5 text-sm font-medium text-white bg-primary rounded-xl hover:bg-navy disabled:opacity-50"
                >
                  {submitting === track.id ? 'Assigning...' : 'Assign'}
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="flex justify-end mt-4">
          <button onClick={onClose} className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg">
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

// ========== MODALS ==========

const CreateTeamModal: React.FC<{ onClose: () => void; onCreated: () => void }> = ({ onClose, onCreated }) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    try {
      setSubmitting(true);
      await serveTeamsApi.createServeTeam({ name: name.trim(), description: description.trim() || undefined });
      onCreated();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-lg font-bold text-gray-800 mb-4">Create Serve Team</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Team Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:border-primary"
              placeholder="e.g., Worship Team"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:border-primary"
              rows={3}
              placeholder="What does this team do?"
            />
          </div>
          <div className="flex gap-3 justify-end">
            <button type="button" onClick={onClose} className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg">
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || !name.trim()}
              className="px-4 py-2 bg-primary text-white rounded-xl hover:bg-navy disabled:opacity-50"
            >
              {submitting ? 'Creating...' : 'Create Team'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const ApplyModal: React.FC<{ teamId: string; onClose: () => void; onApplied: () => void }> = ({ teamId, onClose, onApplied }) => {
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      await serveTeamsApi.applyToTeam(teamId, message.trim() || undefined);
      onApplied();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-lg font-bold text-gray-800 mb-4">Apply to Join Team</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Message (optional)</label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:border-primary"
              rows={3}
              placeholder="Why would you like to join this team?"
            />
          </div>
          <div className="flex gap-3 justify-end">
            <button type="button" onClick={onClose} className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg">
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 bg-primary text-white rounded-xl hover:bg-navy disabled:opacity-50"
            >
              {submitting ? 'Applying...' : 'Submit Application'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const AddResourceModal: React.FC<{ teamId: string; onClose: () => void; onAdded: (r: TeamResource) => void }> = ({ teamId, onClose, onAdded }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [fileUrl, setFileUrl] = useState('');
  const [fileType, setFileType] = useState<'PDF' | 'VIDEO' | 'LINK' | 'DOC'>('PDF');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !fileUrl.trim()) return;
    try {
      setSubmitting(true);
      const resource = await serveTeamsApi.addTeamResource(teamId, {
        title: title.trim(),
        description: description.trim() || undefined,
        fileUrl: fileUrl.trim(),
        fileType,
      });
      onAdded(resource);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-lg font-bold text-gray-800 mb-4">Add Resource</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:border-primary"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:border-primary"
              rows={2}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">File URL</label>
            <input
              type="url"
              value={fileUrl}
              onChange={(e) => setFileUrl(e.target.value)}
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:border-primary"
              placeholder="https://..."
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
            <select
              value={fileType}
              onChange={(e) => setFileType(e.target.value as any)}
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:border-primary"
            >
              <option value="PDF">PDF</option>
              <option value="VIDEO">Video</option>
              <option value="LINK">Link</option>
              <option value="DOC">Document</option>
            </select>
          </div>
          <div className="flex gap-3 justify-end">
            <button type="button" onClick={onClose} className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg">
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || !title.trim() || !fileUrl.trim()}
              className="px-4 py-2 bg-primary text-white rounded-xl hover:bg-navy disabled:opacity-50"
            >
              {submitting ? 'Adding...' : 'Add Resource'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const CreateEventModal: React.FC<{ teamId: string; onClose: () => void; onCreated: (e: TeamEvent) => void }> = ({ teamId, onClose, onCreated }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !startTime) return;
    try {
      setSubmitting(true);
      const event = await serveTeamsApi.createTeamEvent(teamId, {
        title: title.trim(),
        description: description.trim() || undefined,
        location: location.trim() || undefined,
        startTime: new Date(startTime).toISOString(),
        endTime: endTime ? new Date(endTime).toISOString() : undefined,
      });
      onCreated(event);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-lg font-bold text-gray-800 mb-4">Create Event</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Event Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:border-primary"
              placeholder="e.g., Band Rehearsal"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:border-primary"
              rows={2}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:border-primary"
              placeholder="e.g., Main Sanctuary"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Start</label>
              <input
                type="datetime-local"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:border-primary"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">End</label>
              <input
                type="datetime-local"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:border-primary"
              />
            </div>
          </div>
          <div className="flex gap-3 justify-end">
            <button type="button" onClick={onClose} className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg">
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || !title.trim() || !startTime}
              className="px-4 py-2 bg-primary text-white rounded-xl hover:bg-navy disabled:opacity-50"
            >
              {submitting ? 'Creating...' : 'Create Event'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const AddMemberModal: React.FC<{ teamId: string; onClose: () => void; onAdded: () => void }> = ({ teamId, onClose, onAdded }) => {
  const [search, setSearch] = useState('');
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [role, setRole] = useState<'MEMBER' | 'TRAINEE' | 'LEADER'>('MEMBER');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const allUsers = await getUsers();
        setUsers(allUsers);
        setFilteredUsers(allUsers);
      } catch (err: any) {
        setError(err.message || 'Failed to load users');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  useEffect(() => {
    const q = search.toLowerCase().trim();
    if (!q) {
      setFilteredUsers(users);
    } else {
      setFilteredUsers(
        users.filter(
          (u) =>
            u.firstName.toLowerCase().includes(q) ||
            u.lastName.toLowerCase().includes(q) ||
            u.email.toLowerCase().includes(q)
        )
      );
    }
    setSelectedUserId(null);
  }, [search, users]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUserId) return;
    try {
      setSubmitting(true);
      setError(null);
      await addTeamMember(teamId, selectedUserId, role);
      onAdded();
    } catch (err: any) {
      setError(err.message || 'Failed to add member');
    } finally {
      setSubmitting(false);
    }
  };

  const selectedUser = users.find((u) => u.id === selectedUserId);

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-lg font-bold text-gray-800 mb-4">Add Team Member</h2>

        {error && (
          <div className="mb-4 bg-red-50 text-red-700 p-3 rounded-lg text-sm">{error}</div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Search Users</label>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:border-primary"
              placeholder="Search by name or email..."
            />
          </div>

          {loading ? (
            <div className="flex justify-center py-6">
              <div className="animate-spin w-6 h-6 border-4 border-primary border-t-transparent rounded-full" />
            </div>
          ) : (
            <div className="border border-gray-200 rounded-lg max-h-52 overflow-y-auto">
              {filteredUsers.length === 0 ? (
                <div className="p-4 text-center text-sm text-gray-500">No users found.</div>
              ) : (
                filteredUsers.map((u) => (
                  <button
                    key={u.id}
                    type="button"
                    onClick={() => setSelectedUserId(u.id === selectedUserId ? null : u.id)}
                    className={`w-full text-left px-4 py-3 flex items-center gap-3 transition-colors hover:bg-gray-50 border-b border-gray-100 last:border-b-0 ${
                      selectedUserId === u.id ? 'bg-blue-50 hover:bg-blue-50' : ''
                    }`}
                  >
                    <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 font-bold text-xs flex-shrink-0">
                      {u.firstName.charAt(0)}{u.lastName.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-gray-900 truncate">
                        {u.firstName} {u.lastName}
                      </div>
                      <div className="text-xs text-gray-500 truncate">{u.email}</div>
                    </div>
                    {selectedUserId === u.id && (
                      <IoCheckmarkCircleOutline size={18} className="text-blue-600 flex-shrink-0" />
                    )}
                  </button>
                ))
              )}
            </div>
          )}

          {selectedUser && (
            <div className="text-sm text-blue-700 bg-blue-50 px-3 py-2 rounded-lg">
              Selected: <span className="font-medium">{selectedUser.firstName} {selectedUser.lastName}</span>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as 'MEMBER' | 'TRAINEE' | 'LEADER')}
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:border-primary"
            >
              <option value="MEMBER">Member</option>
              <option value="TRAINEE">Trainee</option>
              <option value="LEADER">Leader</option>
            </select>
          </div>

          <div className="flex gap-3 justify-end">
            <button type="button" onClick={onClose} className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg">
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || !selectedUserId}
              className="px-4 py-2 bg-primary text-white rounded-xl hover:bg-navy disabled:opacity-50"
            >
              {submitting ? 'Adding...' : 'Add Member'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ServeTeamPage;

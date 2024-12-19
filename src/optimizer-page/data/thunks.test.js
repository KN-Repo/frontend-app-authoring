import { startLinkCheck, fetchLinkCheckStatus } from './thunks';
import * as api from './api';
import { LINK_CHECK_STATUSES } from './constants';
import { RequestStatus } from '../../data/constants';
import mockApiResponse from '../mocks/mockApiResponse';

describe('startLinkCheck thunk', () => {
  const dispatch = jest.fn();
  const getState = jest.fn();
  const courseId = 'course-123';
  let mockGetStartLinkCheck;

  beforeEach(() => {
    jest.clearAllMocks();

    mockGetStartLinkCheck = jest.spyOn(api, 'postLinkCheck').mockResolvedValue({
      linkCheckStatus: LINK_CHECK_STATUSES.IN_PROGRESS,
    });
  });

  describe('successful request', () => {
    it('should set link check stage and request statuses to their in-progress states', async () => {
      const inProgressStageId = 1;
      await startLinkCheck(courseId)(dispatch, getState);

      expect(dispatch).toHaveBeenCalledWith({
        payload: { status: RequestStatus.PENDING },
        type: 'courseOptimizer/updateSavingStatus',
      });

      expect(dispatch).toHaveBeenCalledWith({
        payload: true,
        type: 'courseOptimizer/updateLinkCheckInProgress',
      });

      expect(dispatch).toHaveBeenCalledWith({
        payload: { status: RequestStatus.SUCCESSFUL },
        type: 'courseOptimizer/updateSavingStatus',
      });

      expect(dispatch).toHaveBeenCalledWith({
        payload: inProgressStageId,
        type: 'courseOptimizer/updateCurrentStage',
      });
    });
  });

  describe('failed request should set stage and request ', () => {
    it('should set request status to failed', async () => {
      const failureStageId = -1;
      mockGetStartLinkCheck.mockRejectedValue(new Error('error'));

      await startLinkCheck(courseId)(dispatch, getState);

      expect(dispatch).toHaveBeenCalledWith({
        payload: { status: RequestStatus.FAILED },
        type: 'courseOptimizer/updateSavingStatus',
      });
      expect(dispatch).toHaveBeenCalledWith({
        payload: false,
        type: 'courseOptimizer/updateLinkCheckInProgress',
      });
      expect(dispatch).toHaveBeenCalledWith({
        payload: -1,
        type: 'courseOptimizer/updateCurrentStage',
      });
    });
  });
});

describe('fetchLinkCheckStatus thunk', () => {
  describe('successful request', () => {
    it('should return scan result', async () => {
      const dispatch = jest.fn();
      const getState = jest.fn();
      const courseId = 'course-123';
      const mockGetLinkCheckStatus = jest
        .spyOn(api, 'getLinkCheckStatus')
        .mockResolvedValue({
          linkCheckStatus: mockApiResponse.LinkCheckStatus,
          linkCheckOutput: mockApiResponse.LinkCheckOutput,
          linkCheckCreatedAt: mockApiResponse.LinkCheckCreatedAt,
        });

      await fetchLinkCheckStatus(courseId)(dispatch, getState);

      expect(dispatch).toHaveBeenCalledWith({
        payload: false,
        type: 'courseOptimizer/updateLinkCheckInProgress',
      });

      expect(dispatch).toHaveBeenCalledWith({
        payload: 2,
        type: 'courseOptimizer/updateCurrentStage',
      });

      expect(dispatch).toHaveBeenCalledWith({
        payload: mockApiResponse.LinkCheckOutput,
        type: 'courseOptimizer/updateLinkCheckResult',
      });

      expect(dispatch).toHaveBeenCalledWith({
        payload: { status: RequestStatus.SUCCESSFUL },
        type: 'courseOptimizer/updateLoadingStatus',
      });
    });
  });

  describe('failed request', () => {
    it('should set request status to failed', async () => {
      const dispatch = jest.fn();
      const getState = jest.fn();
      const courseId = 'course-123';
      const mockGetLinkCheckStatus = jest
        .spyOn(api, 'getLinkCheckStatus')
        .mockRejectedValue(new Error('error'));

      await fetchLinkCheckStatus(courseId)(dispatch, getState);

      expect(dispatch).toHaveBeenCalledWith({
        payload: { status: RequestStatus.FAILED },
        type: 'courseOptimizer/updateLoadingStatus',
      });
    });
  });

  describe('failed scan', () => {
    it('should set error message', async () => {
      const mockGetLinkCheckStatus = jest
        .spyOn(api, 'getLinkCheckStatus')
        .mockResolvedValue({
          linkCheckStatus: LINK_CHECK_STATUSES.FAILED,
          linkCheckOutput: mockApiResponse.LinkCheckOutput,
          linkCheckCreatedAt: mockApiResponse.LinkCheckCreatedAt,
        });

      const dispatch = jest.fn();
      const getState = jest.fn();
      const courseId = 'course-123';

      await fetchLinkCheckStatus(courseId)(dispatch, getState);

      expect(dispatch).toHaveBeenCalledWith({
        payload: true,
        type: 'courseOptimizer/updateIsErrorModalOpen',
      });

      expect(dispatch).toHaveBeenCalledWith({
        payload: { msg: 'Link Check Failed' },
        type: 'courseOptimizer/updateError',
      });

      expect(dispatch).toHaveBeenCalledWith({
        payload: { status: RequestStatus.SUCCESSFUL },
        type: 'courseOptimizer/updateLoadingStatus',
      });

      expect(dispatch).toHaveBeenCalledWith({
        payload: -1,
        type: 'courseOptimizer/updateCurrentStage',
      });

      expect(dispatch).not.toHaveBeenCalledWith({
        payload: expect.anything(),
        type: 'courseOptimizer/updateLinkCheckResult',
      });
    });
  });
});

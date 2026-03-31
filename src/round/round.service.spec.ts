import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource, QueryRunner } from 'typeorm';
import { RoundService } from './round.service';
import { Round, RoundStatus } from './entities/round.entity';
import { Bottle } from './entities/bottle.entity';
import { Answer, RoundPhase } from './entities/answer.entity';
import { GameService } from '../game/game.service';
import { GameStatus } from '../game/entities/game.entity';
import { BadRequestException, ForbiddenException } from '@nestjs/common';

describe('RoundService', () => {
  let service: RoundService;
  let roundRepo: any;
  let bottleRepo: any;
  let answerRepo: any;
  let gameService: any;
  let dataSource: any;

  const mockPlayer1Id = 'player-1-uuid';
  const mockPlayer2Id = 'player-2-uuid';
  const mockHostId = 'host-uuid';

  const mockGame = {
    id: 'game-uuid',
    code: 'ABC123',
    status: GameStatus.ACTIVE,
    hostId: mockHostId,
    host: { id: mockHostId, username: 'host' },
    players: [
      { id: mockHostId, username: 'host' },
      { id: mockPlayer1Id, username: 'player1' },
      { id: mockPlayer2Id, username: 'player2' },
    ],
  };

  const mockBottles: Bottle[] = [
    { id: 'bottle-1', roundId: 'round-1', position: 1, trueColor: null, trueGrape: null, trueName: null } as Bottle,
    { id: 'bottle-2', roundId: 'round-1', position: 2, trueColor: null, trueGrape: null, trueName: null } as Bottle,
    { id: 'bottle-3', roundId: 'round-1', position: 3, trueColor: null, trueGrape: null, trueName: null } as Bottle,
  ];

  const mockRound: Round = {
    id: 'round-1',
    gameId: 'game-uuid',
    roundNumber: 1,
    status: RoundStatus.COLOR,
    bottles: [...mockBottles],
    game: mockGame as any,
  };

  let mockQueryRunner: Partial<QueryRunner>;
  let savedEntities: any[];

  beforeEach(async () => {
    savedEntities = [];

    mockQueryRunner = {
      connect: jest.fn(),
      startTransaction: jest.fn(),
      commitTransaction: jest.fn(),
      rollbackTransaction: jest.fn(),
      release: jest.fn(),
      manager: {
        save: jest.fn().mockImplementation((entity) => {
          savedEntities.push(entity);
          return Promise.resolve(entity);
        }),
        find: jest.fn().mockResolvedValue([]),
        createQueryBuilder: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnThis(),
          getMany: jest.fn().mockResolvedValue([]),
        }),
      } as any,
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RoundService,
        {
          provide: getRepositoryToken(Round),
          useValue: {
            create: jest.fn().mockImplementation((data) => ({ ...data, id: 'round-1' })),
            save: jest.fn().mockImplementation((data) => Promise.resolve(data)),
            findOne: jest.fn().mockResolvedValue(mockRound),
            find: jest.fn().mockResolvedValue([mockRound]),
          },
        },
        {
          provide: getRepositoryToken(Bottle),
          useValue: {
            create: jest.fn().mockImplementation((data) => data),
            save: jest.fn().mockImplementation((data) => Promise.resolve({ ...data, id: `bottle-${data.position}` })),
          },
        },
        {
          provide: getRepositoryToken(Answer),
          useValue: {
            create: jest.fn().mockImplementation((data) => data),
            save: jest.fn().mockImplementation((data) => Promise.resolve({ ...data, id: 'answer-uuid' })),
            findOne: jest.fn().mockResolvedValue(null),
            createQueryBuilder: jest.fn().mockReturnValue({
              select: jest.fn().mockReturnThis(),
              addSelect: jest.fn().mockReturnThis(),
              innerJoin: jest.fn().mockReturnThis(),
              where: jest.fn().mockReturnThis(),
              groupBy: jest.fn().mockReturnThis(),
              addGroupBy: jest.fn().mockReturnThis(),
              orderBy: jest.fn().mockReturnThis(),
              getRawMany: jest.fn().mockResolvedValue([]),
            }),
          },
        },
        {
          provide: GameService,
          useValue: {
            findByCode: jest.fn().mockResolvedValue(mockGame),
            setActive: jest.fn(),
          },
        },
        {
          provide: DataSource,
          useValue: {
            createQueryRunner: jest.fn().mockReturnValue(mockQueryRunner),
          },
        },
      ],
    }).compile();

    service = module.get<RoundService>(RoundService);
    roundRepo = module.get(getRepositoryToken(Round));
    bottleRepo = module.get(getRepositoryToken(Bottle));
    answerRepo = module.get(getRepositoryToken(Answer));
    gameService = module.get(GameService);
    dataSource = module.get(DataSource);
  });

  describe('startRound', () => {
    it('devrait démarrer une manche si le joueur est l\'hôte', async () => {
      roundRepo.findOne.mockResolvedValueOnce(null); // no previous round
      const result = await service.startRound('ABC123', mockHostId);
      expect(result).toBeDefined();
      expect(result.status).toBe(RoundStatus.COLOR);
    });

    it('devrait refuser si le joueur n\'est pas l\'hôte', async () => {
      await expect(
        service.startRound('ABC123', mockPlayer1Id),
      ).rejects.toThrow(ForbiddenException);
    });

    it('devrait refuser si la manche précédente n\'est pas terminée', async () => {
      roundRepo.findOne
        .mockResolvedValueOnce({ ...mockRound, status: RoundStatus.COLOR }); // last round not done
      await expect(
        service.startRound('ABC123', mockHostId),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('submitAnswer', () => {
    it('devrait soumettre une réponse couleur valide', async () => {
      roundRepo.findOne.mockResolvedValue(mockRound);
      const result = await service.submitAnswer('round-1', mockPlayer1Id, {
        bottleId: 'bottle-1',
        roundPhase: RoundPhase.COLOR,
        value: 'rouge',
      });
      expect(result).toBeDefined();
      expect(result.value).toBe('rouge');
    });

    it('devrait refuser si la phase ne correspond pas', async () => {
      const grapeRound = { ...mockRound, status: RoundStatus.GRAPE };
      roundRepo.findOne.mockResolvedValue(grapeRound);

      await expect(
        service.submitAnswer('round-1', mockPlayer1Id, {
          bottleId: 'bottle-1',
          roundPhase: RoundPhase.COLOR,
          value: 'rouge',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('devrait refuser un double vote sur la même bouteille', async () => {
      roundRepo.findOne.mockResolvedValue(mockRound);
      answerRepo.findOne.mockResolvedValueOnce({ id: 'existing-answer' });

      await expect(
        service.submitAnswer('round-1', mockPlayer1Id, {
          bottleId: 'bottle-1',
          roundPhase: RoundPhase.COLOR,
          value: 'rouge',
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('validateRound — scoring', () => {
    it('devrait calculer les scores correctement', async () => {
      const bottlesWithTruth = [
        { ...mockBottles[0], trueColor: 'rouge', trueGrape: 'Merlot', trueName: 'Château X' },
        { ...mockBottles[1], trueColor: 'blanc', trueGrape: 'Chardonnay', trueName: 'Château Y' },
        { ...mockBottles[2], trueColor: 'rosé', trueGrape: 'Grenache', trueName: 'Château Z' },
      ];

      const roundWithBottles = { ...mockRound, bottles: bottlesWithTruth };
      roundRepo.findOne.mockResolvedValue(roundWithBottles);

      // Mock answers: player1 gets 2/3 colors right
      const mockAnswers: Partial<Answer>[] = [
        { id: 'a1', playerId: mockPlayer1Id, bottleId: 'bottle-1', roundPhase: RoundPhase.COLOR, value: 'rouge', isCorrect: null, points: 0 },
        { id: 'a2', playerId: mockPlayer1Id, bottleId: 'bottle-2', roundPhase: RoundPhase.COLOR, value: 'blanc', isCorrect: null, points: 0 },
        { id: 'a3', playerId: mockPlayer1Id, bottleId: 'bottle-3', roundPhase: RoundPhase.COLOR, value: 'rouge', isCorrect: null, points: 0 }, // wrong
      ];

      (mockQueryRunner.manager as any).createQueryBuilder = jest.fn().mockReturnValue({
        where: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue(mockAnswers),
      });

      const result = await service.validateRound('round-1', mockHostId, {
        bottles: [
          { position: 1, trueColor: 'rouge', trueGrape: 'Merlot', trueName: 'Château X' },
          { position: 2, trueColor: 'blanc', trueGrape: 'Chardonnay', trueName: 'Château Y' },
          { position: 3, trueColor: 'rosé', trueGrape: 'Grenache', trueName: 'Château Z' },
        ],
      });

      expect(result.scores[mockPlayer1Id]).toBeDefined();
      expect(result.scores[mockPlayer1Id].points).toBe(2);
      expect(result.scores[mockPlayer1Id].bonus).toBe(false);
    });

    it('devrait appliquer le bonus +3 pour une manche parfaite', async () => {
      const bottlesWithTruth = [
        { ...mockBottles[0], trueColor: 'rouge', trueGrape: 'Merlot', trueName: 'Château X' },
        { ...mockBottles[1], trueColor: 'blanc', trueGrape: 'Chardonnay', trueName: 'Château Y' },
        { ...mockBottles[2], trueColor: 'rosé', trueGrape: 'Grenache', trueName: 'Château Z' },
      ];

      const roundWithBottles = { ...mockRound, bottles: bottlesWithTruth };
      roundRepo.findOne.mockResolvedValue(roundWithBottles);

      // Perfect round: 9 correct answers (3 bottles × 3 phases)
      const perfectAnswers: Partial<Answer>[] = [
        // COLOR phase
        { id: 'a1', playerId: mockPlayer1Id, bottleId: 'bottle-1', roundPhase: RoundPhase.COLOR, value: 'rouge', isCorrect: null, points: 0 },
        { id: 'a2', playerId: mockPlayer1Id, bottleId: 'bottle-2', roundPhase: RoundPhase.COLOR, value: 'blanc', isCorrect: null, points: 0 },
        { id: 'a3', playerId: mockPlayer1Id, bottleId: 'bottle-3', roundPhase: RoundPhase.COLOR, value: 'rosé', isCorrect: null, points: 0 },
        // GRAPE phase
        { id: 'a4', playerId: mockPlayer1Id, bottleId: 'bottle-1', roundPhase: RoundPhase.GRAPE, value: 'Merlot', isCorrect: null, points: 0 },
        { id: 'a5', playerId: mockPlayer1Id, bottleId: 'bottle-2', roundPhase: RoundPhase.GRAPE, value: 'Chardonnay', isCorrect: null, points: 0 },
        { id: 'a6', playerId: mockPlayer1Id, bottleId: 'bottle-3', roundPhase: RoundPhase.GRAPE, value: 'Grenache', isCorrect: null, points: 0 },
        // MATCHING phase
        { id: 'a7', playerId: mockPlayer1Id, bottleId: 'bottle-1', roundPhase: RoundPhase.MATCHING, value: '1', isCorrect: null, points: 0 },
        { id: 'a8', playerId: mockPlayer1Id, bottleId: 'bottle-2', roundPhase: RoundPhase.MATCHING, value: '2', isCorrect: null, points: 0 },
        { id: 'a9', playerId: mockPlayer1Id, bottleId: 'bottle-3', roundPhase: RoundPhase.MATCHING, value: '3', isCorrect: null, points: 0 },
      ];

      (mockQueryRunner.manager as any).createQueryBuilder = jest.fn().mockReturnValue({
        where: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue(perfectAnswers),
      });

      const result = await service.validateRound('round-1', mockHostId, {
        bottles: [
          { position: 1, trueColor: 'rouge', trueGrape: 'Merlot', trueName: 'Château X' },
          { position: 2, trueColor: 'blanc', trueGrape: 'Chardonnay', trueName: 'Château Y' },
          { position: 3, trueColor: 'rosé', trueGrape: 'Grenache', trueName: 'Château Z' },
        ],
      });

      expect(result.scores[mockPlayer1Id].points).toBe(12); // 9 + 3 bonus
      expect(result.scores[mockPlayer1Id].bonus).toBe(true);
    });

    it('devrait refuser la validation si le joueur n\'est pas l\'hôte', async () => {
      roundRepo.findOne.mockResolvedValue(mockRound);

      await expect(
        service.validateRound('round-1', mockPlayer1Id, {
          bottles: [
            { position: 1, trueColor: 'rouge', trueGrape: 'Merlot', trueName: 'Château X' },
            { position: 2, trueColor: 'blanc', trueGrape: 'Chardonnay', trueName: 'Château Y' },
            { position: 3, trueColor: 'rosé', trueGrape: 'Grenache', trueName: 'Château Z' },
          ],
        }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('devrait refuser si le nombre de bouteilles n\'est pas 3', async () => {
      roundRepo.findOne.mockResolvedValue(mockRound);

      await expect(
        service.validateRound('round-1', mockHostId, {
          bottles: [
            { position: 1, trueColor: 'rouge', trueGrape: 'Merlot', trueName: 'Château X' },
          ],
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('devrait faire un rollback en cas d\'erreur', async () => {
      roundRepo.findOne.mockResolvedValue(mockRound);

      (mockQueryRunner.manager as any).save = jest.fn().mockRejectedValue(new Error('DB error'));

      await expect(
        service.validateRound('round-1', mockHostId, {
          bottles: [
            { position: 1, trueColor: 'rouge', trueGrape: 'Merlot', trueName: 'Château X' },
            { position: 2, trueColor: 'blanc', trueGrape: 'Chardonnay', trueName: 'Château Y' },
            { position: 3, trueColor: 'rosé', trueGrape: 'Grenache', trueName: 'Château Z' },
          ],
        }),
      ).rejects.toThrow();

      expect(mockQueryRunner.rollbackTransaction).toHaveBeenCalled();
      expect(mockQueryRunner.release).toHaveBeenCalled();
    });
  });

  describe('advancePhase', () => {
    it('devrait passer de COLOR à GRAPE', async () => {
      roundRepo.findOne.mockResolvedValue({ ...mockRound, status: RoundStatus.COLOR });

      const result = await service.advancePhase('round-1', mockHostId);
      expect(result.status).toBe(RoundStatus.GRAPE);
    });

    it('devrait passer de GRAPE à MATCHING', async () => {
      roundRepo.findOne.mockResolvedValue({ ...mockRound, status: RoundStatus.GRAPE });

      const result = await service.advancePhase('round-1', mockHostId);
      expect(result.status).toBe(RoundStatus.MATCHING);
    });

    it('devrait refuser si le joueur n\'est pas l\'hôte', async () => {
      roundRepo.findOne.mockResolvedValue(mockRound);

      await expect(
        service.advancePhase('round-1', mockPlayer1Id),
      ).rejects.toThrow(ForbiddenException);
    });
  });
});

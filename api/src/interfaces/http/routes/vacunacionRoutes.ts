import { Router } from "express";
import { PostgresVacunacionRepository } from "../../../infrastructure/adapters/PostgresVacunacionRepository.js";
import { RedisCacheAdapter } from "../../../infrastructure/adapters/RedisCacheAdapter.js";
import { GetVacunacionPendienteUseCase } from "../../../application/use-cases/GetVacunacionPendienteUseCase.js";
import { AplicarVacunaUseCase } from "../../../application/use-cases/AplicarVacunaUseCase.js";
import { VacunacionController } from "../controllers/vacunacionController.js";

const router = Router();

const repository = new PostgresVacunacionRepository();
const cache = new RedisCacheAdapter();
const getUseCase = new GetVacunacionPendienteUseCase(repository, cache);
const postUseCase = new AplicarVacunaUseCase(repository, cache);
const controller = new VacunacionController(getUseCase, postUseCase);

router.get("/vacunas/pendientes", controller.getPendientes);
router.post("/vacunas/aplicar", controller.aplicarVacuna);

export default router;

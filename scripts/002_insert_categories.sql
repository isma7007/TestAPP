-- Insertando todas las categorías de carnet solicitadas
INSERT INTO categories (code, name, description, total_tests, questions_per_test, time_limit_minutes, pass_threshold) VALUES
('B', 'Permiso B (Turismo)', 'Permiso para conducir automóviles y vehículos de hasta 3.500 kg', 100, 30, 30, 27),
('A1', 'Permiso A1 (Motocicleta)', 'Permiso para motocicletas de hasta 125cc y 11kW', 50, 30, 30, 27),
('A2', 'Permiso A2 (Motocicleta)', 'Permiso para motocicletas de hasta 35kW', 50, 30, 30, 27),
('AM', 'Permiso AM (Ciclomotor)', 'Permiso para ciclomotores de hasta 50cc', 30, 20, 20, 18),
('C1', 'Permiso C1 (Camión)', 'Permiso para camiones de 3.500 a 7.500 kg', 40, 30, 30, 27),
('C', 'Permiso C (Camión)', 'Permiso para camiones de más de 7.500 kg', 50, 30, 30, 27),
('D1', 'Permiso D1 (Autobús)', 'Permiso para autobuses de hasta 16 plazas', 40, 30, 30, 27),
('D', 'Permiso D (Autobús)', 'Permiso para autobuses de más de 16 plazas', 50, 30, 30, 27),
('BE', 'Permiso B+E (Remolque)', 'Permiso B con remolque de más de 750 kg', 30, 20, 20, 18),
('CE', 'Permiso C+E (Remolque)', 'Permiso C con remolque de más de 750 kg', 40, 30, 30, 27),
('ADR', 'ADR (Mercancías peligrosas)', 'Certificado para transporte de mercancías peligrosas', 25, 30, 45, 27),
('CAP-M', 'CAP (Mercancías)', 'Certificado de Aptitud Profesional para mercancías', 35, 30, 30, 27),
('CAP-V', 'CAP (Viajeros)', 'Certificado de Aptitud Profesional para viajeros', 35, 30, 30, 27),
('CP-M', 'Comp. profesional (Mercancías)', 'Competencia profesional para mercancías', 30, 25, 25, 22),
('CP-V', 'Comp. profesional (Viajeros)', 'Competencia profesional para viajeros', 30, 25, 25, 22),
('CS', 'Consejero de seguridad', 'Consejero de seguridad para mercancías peligrosas', 20, 40, 60, 36),
('RP', 'Recuperación de puntos', 'Curso de sensibilización y reeducación vial', 15, 20, 30, 18)
ON CONFLICT (code) DO NOTHING;

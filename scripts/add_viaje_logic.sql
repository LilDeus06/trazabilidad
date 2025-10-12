-- Function to calculate next viaje number for a chofer on a specific date
CREATE OR REPLACE FUNCTION get_next_viaje_number(
  p_chofer text,
  p_fecha date
) RETURNS integer AS $$
DECLARE
  next_viaje integer;
BEGIN
  -- Get the maximum viaje number for this chofer on this date
  SELECT COALESCE(MAX(g.viaje), 0) + 1
  INTO next_viaje
  FROM guias g
  INNER JOIN camiones c ON g.id_camion = c.id
  WHERE c.chofer = p_chofer
    AND DATE(g.fecha_hora) = p_fecha;

  RETURN next_viaje;
END;
$$ LANGUAGE plpgsql;

-- Function to recalculate viaje numbers after deletion
CREATE OR REPLACE FUNCTION recalculate_viajes_after_deletion(
  p_chofer text,
  p_fecha date,
  p_deleted_viaje integer
) RETURNS void AS $$
BEGIN
  -- Update all viajes greater than the deleted one for the same chofer and date
  UPDATE guias
  SET viaje = viaje - 1
  FROM camiones c
  WHERE guias.id_camion = c.id
    AND c.chofer = p_chofer
    AND DATE(guias.fecha_hora) = p_fecha
    AND guias.viaje > p_deleted_viaje;
END;
$$ LANGUAGE plpgsql;

import { describe, expect, it } from 'vitest';
import { ApiError } from '../src/api/client';
import { parseMoneyInput, splitErrors } from '../src/forms';

describe('splitErrors', () => {
  it('maps each field error to its field, keeping the first message of a field', () => {
    const error = new ApiError(422, 'Dados inválidos', [
      { field: 'name', message: 'Obrigatório' },
      { field: 'name', message: 'Muito longo' },
      { field: 'email', message: 'E-mail inválido' },
    ]);

    const result = splitErrors(error, ['name', 'email']);

    expect(result).toEqual({
      fields: { name: 'Obrigatório', email: 'E-mail inválido' },
      message: null,
    });
  });

  it('moves errors of fields the form does not have to the general message', () => {
    const error = new ApiError(422, 'Dados inválidos', [
      { field: 'sentAt', message: 'Informe a data de envio' },
    ]);

    const result = splitErrors(error, ['status']);

    expect(result).toEqual({ fields: {}, message: 'Informe a data de envio' });
  });

  it('uses the detail when a 422 has no field errors', () => {
    const error = new ApiError(422, 'Transição de status não permitida', []);

    expect(splitErrors(error, ['status'])).toEqual({
      fields: {},
      message: 'Transição de status não permitida',
    });
  });

  it('shows the connection message when the server could not be reached', () => {
    const error = new ApiError(0, 'Não foi possível conectar ao servidor', []);

    expect(splitErrors(error, []).message).toBe('Não foi possível conectar ao servidor');
  });

  it('falls back to a generic message for errors that are not ApiError', () => {
    expect(splitErrors(new TypeError('boom'), [])).toEqual({
      fields: {},
      message: 'Erro inesperado',
    });
  });
});

describe('parseMoneyInput', () => {
  it.each([
    ['1500', 1500],
    ['1500,50', 1500.5],
    ['1.500,50', 1500.5],
    ['1.500,00', 1500],
    ['1500.5', 1500.5],
    ['12.5', 12.5],
    ['1500.50', 1500.5],
    ['R$ 1.500,00', 1500],
  ])('reads %j as %d', (text, expected) => {
    expect(parseMoneyInput(text)).toBe(expected);
  });

  it.each(['', 'abc', '1,2,3', '-5', '1.500', '1.500.000'])('rejects %j', (text) => {
    expect(parseMoneyInput(text)).toBeNull();
  });
});
